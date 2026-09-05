import { 
  Product, 
  Consumption, 
  Purchase, 
  ProductCalculations, 
  PurchaseRecommendationStatus 
} from '../types';

/**
 * Motor de Cálculos Determinísticos do CasaControle
 * 
 * Regra de Ouro:
 * Nenhuma IA é usada para contas básicas.
 * Apenas fórmulas matemáticas transparentes, determinísticas e confiáveis.
 */

export function calculateProductMetrics(
  product: Product,
  consumptions: Consumption[],
  referenceDate: Date = new Date()
): ProductCalculations {
  // Filtrar consumos específicos deste produto
  const prodConsumptions = consumptions
    .filter(c => c.product_id === product.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalConsumed = prodConsumptions.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
  const recordsCount = prodConsumptions.length;

  if (recordsCount === 0) {
    // Sem registros de consumo
    const status: PurchaseRecommendationStatus = product.current_stock <= 0 ? 'buy_now' : 'buy_soon';
    const suggestedQuantity = product.min_stock_alert && product.current_stock < product.min_stock_alert 
      ? Math.max(1, product.min_stock_alert - product.current_stock)
      : (product.current_stock === 0 ? 1 : 0);

    return {
      productId: product.id,
      totalConsumed: 0,
      recordsCount: 0,
      daysOfHistory: 0,
      hasSufficientHistory: false,
      historyStatusMessage: 'Sem histórico de consumo registrado.',
      avgDailyConsumption: 0,
      avgWeeklyConsumption: 0,
      avgMonthlyConsumption: 0,
      daysOfStockEstimated: null,
      consumptionTrend: 'unknown',
      recommendation: {
        status,
        statusLabel: product.current_stock <= 0 ? 'Comprar' : 'Estoque sob observação',
        color: product.current_stock <= 0 ? 'red' : 'amber',
        suggestedQuantity,
        explanation: product.current_stock <= 0 
          ? 'Estoque zerado. Registre compras ou consumos para iniciar o cálculo inteligente.' 
          : 'Estoque disponível, aguardando registros de consumo para prever duração.',
      },
    };
  }

  const firstDate = new Date(prodConsumptions[0].date);
  const lastDate = new Date(prodConsumptions[recordsCount - 1].date);
  
  // Período total em dias cobertos pelos registros
  // Mínimo de 1 dia para evitar divisão por zero se foi registrado no mesmo dia
  const diffTime = Math.abs(referenceDate.getTime() - firstDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Critério de histórico suficiente:
  // Precisa de pelo menos 2 registros OU pelo menos 7 dias desde o primeiro registro
  const hasSufficientHistory = recordsCount >= 2 || diffDays >= 7;

  let historyStatusMessage = 'Histórico consolidado com dados reais.';
  if (!hasSufficientHistory) {
    historyStatusMessage = `Estimativa em formação (${recordsCount} registro). Recomenda-se registrar mais dias para maior precisão.`;
  }

  // Consumo diário médio ponderado pelo período decorrido
  const avgDailyConsumption = totalConsumed / diffDays;
  const avgWeeklyConsumption = avgDailyConsumption * 7;
  const avgMonthlyConsumption = avgDailyConsumption * 30;

  // Dias estimados de estoque restante
  let daysOfStockEstimated: number | null = null;
  if (avgDailyConsumption > 0) {
    daysOfStockEstimated = Math.max(0, Math.floor(product.current_stock / avgDailyConsumption));
  } else if (product.current_stock > 0) {
    daysOfStockEstimated = 999; // Estoque não está sendo consumido
  }

  // Análise de tendência (compara últimos 14 dias com 14 dias anteriores se houver histórico)
  let consumptionTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown' = 'unknown';
  if (diffDays >= 14 && recordsCount >= 3) {
    const fourteenDaysAgo = new Date(referenceDate);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const twentyEightDaysAgo = new Date(referenceDate);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const recentConsumption = prodConsumptions
      .filter(c => new Date(c.date) >= fourteenDaysAgo)
      .reduce((s, c) => s + c.quantity, 0);

    const priorConsumption = prodConsumptions
      .filter(c => new Date(c.date) >= twentyEightDaysAgo && new Date(c.date) < fourteenDaysAgo)
      .reduce((s, c) => s + c.quantity, 0);

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
  // Classificação da Lista de Compras Inteligente:
  // 🔴 Comprar (buy_now)
  // 🟡 Comprar em breve (buy_soon)
  // 🟢 Não comprar (dont_buy)
  // -------------------------------------------------------------
  let status: PurchaseRecommendationStatus = 'dont_buy';
  let statusLabel = 'Não comprar';
  let color: 'red' | 'amber' | 'emerald' = 'emerald';
  let suggestedQuantity = 0;
  let explanation = '';

  const currentStock = product.current_stock;

  if (currentStock <= 0) {
    status = 'buy_now';
    statusLabel = 'Comprar';
    color = 'red';
    // Sugere o consumo mensal se disponível, ou alerta mínimo, ou 1 unidade
    suggestedQuantity = avgMonthlyConsumption > 0 
      ? Math.ceil(avgMonthlyConsumption) 
      : (product.min_stock_alert || 1);
    explanation = `Estoque esgotado (0 ${product.unit}). Recomenda-se repor para o consumo mensal de ~${Math.ceil(avgMonthlyConsumption || 1)} ${product.unit}.`;
  } else if (daysOfStockEstimated !== null && daysOfStockEstimated <= 7) {
    // Menos de 7 dias de estoque restante
    status = 'buy_now';
    statusLabel = 'Comprar';
    color = 'red';
    // Necessidade para completar 30 dias de estoque
    const needed = Math.max(0, avgMonthlyConsumption - currentStock);
    suggestedQuantity = Math.ceil(needed);
    explanation = `Estoque crítico: resta apenas cerca de ${daysOfStockEstimated} ${daysOfStockEstimated === 1 ? 'dia' : 'dias'}. Consumo mensal previsto: ${avgMonthlyConsumption.toFixed(1)} ${product.unit}.`;
  } else if (daysOfStockEstimated !== null && daysOfStockEstimated <= 15) {
    // Entre 8 e 15 dias de estoque
    status = 'buy_soon';
    statusLabel = 'Comprar em breve';
    color = 'amber';
    const needed = Math.max(0, avgMonthlyConsumption - currentStock);
    suggestedQuantity = Math.ceil(needed);
    explanation = `Estoque suficiente para ~${daysOfStockEstimated} dias (aproximadamente duas semanas). Fique atento às promoções.`;
  } else {
    // Estoque suficiente para mais de 15 dias ou supera o consumo mensal
    status = 'dont_buy';
    statusLabel = 'Não comprar';
    color = 'emerald';
    suggestedQuantity = 0;
    
    if (daysOfStockEstimated !== null && daysOfStockEstimated < 900) {
      explanation = `Estoque seguro: você possui ${currentStock} ${product.unit}, suficiente para ~${daysOfStockEstimated} dias com base no seu consumo mensal de ~${avgMonthlyConsumption.toFixed(1)} ${product.unit}.`;
    } else {
      explanation = `Você possui ${currentStock} ${product.unit} em casa. Não há necessidade de comprar agora.`;
    }
  }

  // Arredondamento amigável para a quantidade sugerida
  if (suggestedQuantity > 0 && ['unidade', 'rolo', 'caixa', 'pacote', 'dúzia', 'bandeja'].includes(product.unit.toLowerCase())) {
    suggestedQuantity = Math.round(suggestedQuantity);
  } else if (suggestedQuantity > 0) {
    // g, kg, L, ml
    suggestedQuantity = Number(suggestedQuantity.toFixed(1));
  }

  return {
    productId: product.id,
    totalConsumed,
    recordsCount,
    firstRecordDate: prodConsumptions[0].date,
    lastRecordDate: prodConsumptions[recordsCount - 1].date,
    daysOfHistory: diffDays,
    hasSufficientHistory,
    historyStatusMessage,
    avgDailyConsumption,
    avgWeeklyConsumption,
    avgMonthlyConsumption,
    daysOfStockEstimated,
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

  // Mês anterior
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
      monthExpenses += amount;
    } else if (y === prevYear && m === prevMonth) {
      previousMonthExpenses += amount;
    }
  });

  let expensesDiffPercentage = 0;
  if (previousMonthExpenses > 0) {
    expensesDiffPercentage = ((monthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
  }

  return {
    monthExpenses,
    previousMonthExpenses,
    expensesDiffPercentage,
  };
}

/**
 * Formatação de moeda amigável em BRL
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
  const rounded = Number.isInteger(qty) ? qty.toString() : qty.toFixed(1);
  return `${rounded} ${unit}`;
}
