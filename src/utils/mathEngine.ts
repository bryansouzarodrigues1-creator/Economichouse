import { 
  Product, 
  Consumption, 
  Purchase, 
  ProductCalculations, 
  PurchaseRecommendationStatus,
  ConsumptionDataReliability
} from '../types';
import { roundPrecision, safeAdd, safeSub, safeDiv, clampNonNegative } from './math';
import { normalizeUnit, formatUnitDisplay } from './units';

/**
 * Motor de Cálculos Determinísticos do CasaControle
 * 
 * Regra de Ouro:
 * Nenhuma IA ou heurística opaca é usada para contas básicas.
 * Apenas fórmulas matemáticas transparentes, determinísticas, auditáveis e explicáveis.
 */

export function calculateProductMetrics(
  product: Product,
  consumptions: Consumption[],
  referenceDate: Date = new Date(),
  planningDays: number = 30,
  lowStockDaysThreshold: number = 7
): ProductCalculations {
  const currentStock = clampNonNegative(product.current_stock || 0);

  // Filtrar consumos específicos deste produto e ordenar por data cronológica
  const prodConsumptions = consumptions
    .filter(c => c.product_id === product.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalConsumed = prodConsumptions.reduce((acc, curr) => safeAdd(acc, curr.quantity || 0), 0);
  const recordsCount = prodConsumptions.length;

  // -------------------------------------------------------------
  // Classificação de Confiabilidade do Histórico
  // -------------------------------------------------------------
  let diffDays = 0;
  let firstRecordDate: string | undefined = undefined;
  let lastRecordDate: string | undefined = undefined;

  if (recordsCount > 0) {
    firstRecordDate = prodConsumptions[0].date;
    lastRecordDate = prodConsumptions[recordsCount - 1].date;
    const firstTime = new Date(firstRecordDate).getTime();
    const refTime = referenceDate.getTime();
    const rawDiff = Math.abs(refTime - firstTime);
    // Mínimo de 1 dia para evitar divisão por zero se foi registrado hoje
    diffDays = Math.max(1, Math.ceil(rawDiff / (1000 * 60 * 60 * 24)));
  }

  let reliability: ConsumptionDataReliability = 'insufficient_data';
  let reliabilityLabel = 'Sem dados suficientes';
  let historyStatusMessage = 'Sem registros de consumo para prever velocidade.';

  if (recordsCount === 0) {
    reliability = 'insufficient_data';
    reliabilityLabel = 'Sem dados suficientes';
    historyStatusMessage = 'Nenhum consumo registrado ainda.';
  } else if (recordsCount < 2 || diffDays < 3) {
    reliability = 'insufficient_data';
    reliabilityLabel = 'Sem dados suficientes';
    historyStatusMessage = `Apenas ${recordsCount} registro. Registre mais consumos ao longo dos dias para habilitar a previsão determinística.`;
  } else if (recordsCount < 5 || diffDays < 14) {
    reliability = 'forming_history';
    reliabilityLabel = 'Histórico em formação';
    historyStatusMessage = `Histórico em formação (${recordsCount} registros em ${diffDays} dias). As projeções ficarão ainda mais precisas com o tempo.`;
  } else {
    reliability = 'reliable_estimate';
    reliabilityLabel = 'Estimativa confiável';
    historyStatusMessage = `Histórico consolidado (${recordsCount} registros em ${diffDays} dias). Projeção determinística de alta fidelidade.`;
  }

  const hasSufficientHistory = reliability !== 'insufficient_data';

  // -------------------------------------------------------------
  // Médias de Consumo (Velocidade Diária, Semanal, Mensal)
  // -------------------------------------------------------------
  let avgDailyConsumption = 0;
  let avgWeeklyConsumption = 0;
  let avgMonthlyConsumption = 0;

  if (hasSufficientHistory && diffDays > 0) {
    avgDailyConsumption = safeDiv(totalConsumed, diffDays, 0, 4);
    avgWeeklyConsumption = roundPrecision(avgDailyConsumption * 7, 3);
    avgMonthlyConsumption = roundPrecision(avgDailyConsumption * planningDays, 3);
  }

  // -------------------------------------------------------------
  // Duração Estimada do Estoque (em Dias) e Data de Término
  // -------------------------------------------------------------
  let daysOfStockEstimated: number | null = null;
  let estimatedDepletionDate: string | null = null;

  if (avgDailyConsumption > 0) {
    daysOfStockEstimated = Math.max(0, Math.floor(currentStock / avgDailyConsumption));
    
    // Calcula a data estimada de término
    const depletion = new Date(referenceDate);
    depletion.setDate(depletion.getDate() + daysOfStockEstimated);
    estimatedDepletionDate = depletion.toISOString().split('T')[0];
  } else if (currentStock > 0 && recordsCount > 0) {
    // Possui estoque e sem consumo recente
    daysOfStockEstimated = 999;
  }

  // -------------------------------------------------------------
  // Análise de Tendência
  // -------------------------------------------------------------
  let consumptionTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown' = 'unknown';
  if (diffDays >= 14 && recordsCount >= 3) {
    const fourteenDaysAgo = new Date(referenceDate);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const twentyEightDaysAgo = new Date(referenceDate);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const recentConsumption = prodConsumptions
      .filter(c => new Date(c.date) >= fourteenDaysAgo)
      .reduce((s, c) => safeAdd(s, c.quantity || 0), 0);

    const priorConsumption = prodConsumptions
      .filter(c => new Date(c.date) >= twentyEightDaysAgo && new Date(c.date) < fourteenDaysAgo)
      .reduce((s, c) => safeAdd(s, c.quantity || 0), 0);

    if (priorConsumption > 0) {
      const ratio = recentConsumption / priorConsumption;
      if (ratio > 1.2) consumptionTrend = 'increasing';
      else if (ratio < 0.8) consumptionTrend = 'decreasing';
      else consumptionTrend = 'stable';
    } else {
      consumptionTrend = 'stable';
    }
  }

  // -------------------------------------------------------------
  // Recomendação de Compra Explicável e Determinística
  // -------------------------------------------------------------
  let status: PurchaseRecommendationStatus = 'dont_buy';
  let statusLabel = 'Não comprar';
  let color: 'red' | 'amber' | 'emerald' = 'emerald';
  let suggestedQuantity = 0;
  let explanation = '';

  const minAlert = Number(product.min_stock_alert || 0);

  if (currentStock <= 0) {
    // 1. Estoque Zerado -> COMPRAR
    status = 'buy_now';
    statusLabel = 'Comprar';
    color = 'red';
    
    if (avgMonthlyConsumption > 0) {
      suggestedQuantity = avgMonthlyConsumption;
      explanation = `Estoque esgotado (0 ${product.unit}). Recomenda-se repor para o consumo mensal de ~${formatUnitDisplay(avgMonthlyConsumption, product.unit)}.`;
    } else if (minAlert > 0) {
      suggestedQuantity = minAlert;
      explanation = `Estoque esgotado (0 ${product.unit}). Repor o estoque mínimo cadastrado de ${formatUnitDisplay(minAlert, product.unit)}.`;
    } else {
      suggestedQuantity = 1;
      explanation = `Estoque esgotado (0 ${product.unit}). Registre compras ou consumos para calibrar o consumo mensal inteligente.`;
    }
  } else if (!hasSufficientHistory) {
    // 2. Histórico Insuficiente mas tem estoque
    if (minAlert > 0 && currentStock <= minAlert) {
      status = 'buy_now';
      statusLabel = 'Comprar';
      color = 'red';
      suggestedQuantity = Math.max(1, safeSub(minAlert * 2, currentStock));
      explanation = `Estoque atual (${currentStock} ${product.unit}) atingiu o alerta mínimo familiar de ${minAlert} ${product.unit}.`;
    } else {
      status = 'dont_buy';
      statusLabel = 'Não comprar';
      color = 'emerald';
      suggestedQuantity = 0;
      explanation = `Você possui ${currentStock} ${product.unit} em casa. Registre os consumos para que o sistema aprenda o ritmo familiar antes de sugerir compras.`;
    }
  } else {
    // 3. Histórico em formação ou confiável -> baseado na velocidade real de consumo
    const days = daysOfStockEstimated ?? 999;

    if (days <= lowStockDaysThreshold || (minAlert > 0 && currentStock <= minAlert)) {
      // Menos de 7 dias (ou limite configurado) -> 🔴 Comprar
      status = 'buy_now';
      statusLabel = 'Comprar';
      color = 'red';
      const needed = safeSub(avgMonthlyConsumption, currentStock);
      suggestedQuantity = Math.max(1, roundPrecision(needed, 1));
      explanation = `Estoque crítico: resta apenas ~${days} ${days === 1 ? 'dia' : 'dias'} de suprimento. O consumo médio mensal é de ~${formatUnitDisplay(avgMonthlyConsumption, product.unit)}.`;
    } else if (days <= 15) {
      // Entre 8 e 15 dias -> 🟡 Comprar em breve
      status = 'buy_soon';
      statusLabel = 'Comprar em breve';
      color = 'amber';
      const needed = safeSub(avgMonthlyConsumption, currentStock);
      suggestedQuantity = Math.max(1, roundPrecision(needed, 1));
      explanation = `Estoque suficiente para ~${days} dias (aproximadamente duas semanas). Comece a pesquisar preços e promoções.`;
    } else {
      // Mais de 15 dias -> 🟢 Não comprar
      status = 'dont_buy';
      statusLabel = 'Não comprar';
      color = 'emerald';
      suggestedQuantity = 0;
      explanation = `Estoque seguro: você possui ${currentStock} ${product.unit}, suficiente para aproximadamente ${days < 900 ? `~${days} dias` : 'um longo período'} com base no consumo médio mensal de ~${formatUnitDisplay(avgMonthlyConsumption, product.unit)}. Não comprar agora.`;
    }
  }

  // Ajuste fino para unidades discretas (inteiras) vs contínuas
  const isDiscrete = ['unidade', 'rolo', 'caixa', 'pacote', 'dúzia', 'bandeja'].includes(
    normalizeUnit(product.unit).toLowerCase()
  );

  if (suggestedQuantity > 0) {
    if (isDiscrete) {
      suggestedQuantity = Math.ceil(suggestedQuantity);
    } else {
      suggestedQuantity = roundPrecision(suggestedQuantity, 1);
    }
  }

  return {
    productId: product.id,
    totalConsumed,
    recordsCount,
    firstRecordDate,
    lastRecordDate,
    daysOfHistory: diffDays,
    hasSufficientHistory,
    reliability,
    reliabilityLabel,
    historyStatusMessage,
    avgDailyConsumption: roundPrecision(avgDailyConsumption, 4),
    avgWeeklyConsumption: roundPrecision(avgWeeklyConsumption, 3),
    avgMonthlyConsumption: roundPrecision(avgMonthlyConsumption, 3),
    daysOfStockEstimated,
    estimatedDepletionDate,
    consumptionTrend,
    recommendation: {
      status,
      statusLabel,
      color,
      suggestedQuantity,
      explanation,
    },
  };
}

/**
 * Compara gastos entre o mês atual e o mês anterior
 */
export function calculateMonthlyComparison(
  purchases: Purchase[],
  referenceDate: Date = new Date()
) {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-11

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();

  let monthExpenses = 0;
  let previousMonthExpenses = 0;

  purchases.forEach(p => {
    const pDate = new Date(p.date);
    const y = pDate.getFullYear();
    const m = pDate.getMonth();
    const amount = Number(p.total_amount || 0);

    if (y === currentYear && m === currentMonth) {
      monthExpenses = safeAdd(monthExpenses, amount, 2);
    } else if (y === prevYear && m === prevMonth) {
      previousMonthExpenses = safeAdd(previousMonthExpenses, amount, 2);
    }
  });

  let expensesDiffPercentage = 0;
  if (previousMonthExpenses > 0) {
    expensesDiffPercentage = roundPrecision(
      ((monthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100,
      1
    );
  }

  return {
    monthExpenses,
    previousMonthExpenses,
    expensesDiffPercentage,
  };
}

/**
 * Formatação de moeda em Real Brasileiro (BRL)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
}

/**
 * Formatação amigável de quantidade e unidade
 */
export function formatQuantityWithUnit(qty: number, unit: string): string {
  return formatUnitDisplay(qty, unit);
}
