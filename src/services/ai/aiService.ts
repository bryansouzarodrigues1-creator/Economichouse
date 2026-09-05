/**
 * Camada de Serviço de Inteligência Artificial (Pluggable AI Service)
 * 
 * Arquitetura Desacoplada:
 * - Mantém os cálculos determinísticos 100% no sistema.
 * - Permite trocar facilmente entre Provedores:
 *   1. 'local_rules' (Padrão atual - sem custos, sem dependência externa obrigatória)
 *   2. 'gemini' (Google Gemini API via @google/genai)
 *   3. 'lovable_gateway' (AI Gateway no Lovable/Supabase)
 */

export interface AiAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  patternsDetected?: string[];
  savingsPotentialBRL?: number;
}

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  suggestedCategory?: string;
}

export interface ParsedReceiptResult {
  storeName?: string;
  date?: string;
  totalAmount?: number;
  items: ParsedReceiptItem[];
  confidence: number;
}

export interface HouseAiContext {
  houseName: string;
  membersCount: number;
  productsCount: number;
  lowStockItemsCount: number;
  currentMonthExpenses: number;
  topCategories: string[];
}

export interface IAiService {
  readonly providerName: string;
  readonly isReady: boolean;
  
  analyzeConsumption(context: HouseAiContext, consumptionSummary: string): Promise<AiAnalysisResult>;
  analyzeExpenses(context: HouseAiContext, expensesSummary: string): Promise<AiAnalysisResult>;
  askHouseAssistant(question: string, context: HouseAiContext): Promise<string>;
  parseReceiptImage(imageBase64: string): Promise<ParsedReceiptResult>;
}

/**
 * Provedor Local / Heurístico (Ativo nesta 1ª Etapa)
 * Funciona offline, com custo ZERO e sem quebrar se a API não estiver configurada.
 */
export class LocalRuleAiProvider implements IAiService {
  readonly providerName = 'Local Rules (Preparado para IA)';
  readonly isReady = true;

  async analyzeConsumption(context: HouseAiContext, _consumptionSummary: string): Promise<AiAnalysisResult> {
    return {
      summary: `Análise preliminar de consumo para a ${context.houseName}.`,
      insights: [
        `Base cadastral com ${context.productsCount} produtos monitorados.`,
        context.lowStockItemsCount > 0 
          ? `Atenção: ${context.lowStockItemsCount} produto(s) estão com estoque baixo ou no limite semanal.`
          : 'Estoque doméstico equilibrado neste momento.',
      ],
      recommendations: [
        'Continue registrando o consumo regular por mais alguns dias para consolidar a média diária.',
        'Priorize repor apenas os itens classificados como 🔴 Comprar para evitar desperdício de dinheiro.',
      ],
      patternsDetected: [
        'Registro de hábitos em fase de aprendizado estatístico.',
      ],
    };
  }

  async analyzeExpenses(context: HouseAiContext, _expensesSummary: string): Promise<AiAnalysisResult> {
    return {
      summary: `Avaliação de despesas familiares para ${context.houseName}.`,
      insights: [
        `Despesa registrada no mês: R$ ${context.currentMonthExpenses.toFixed(2)}.`,
        context.topCategories.length > 0 
          ? `Categorias com maior circulação: ${context.topCategories.join(', ')}.`
          : 'Cadastre categorias para visualizar a distribuição dos gastos.',
      ],
      recommendations: [
        'Verifique os preços médios históricos ao ir ao supermercado.',
        'Consulte a Lista Inteligente antes de sair para as compras.',
      ],
    };
  }

  async askHouseAssistant(question: string, context: HouseAiContext): Promise<string> {
    const q = question.toLowerCase();
    if (q.includes('estoque') || q.includes('falta')) {
      return `Olá! Na ${context.houseName}, temos ${context.lowStockItemsCount} itens marcados para compra imediata ou estoque baixo. Verifique a aba "Lista Inteligente" para a lista exata calculada pelo sistema.`;
    }
    if (q.includes('gasto') || q.includes('compras')) {
      return `Até agora, os registros do mês somam R$ ${context.currentMonthExpenses.toFixed(2)}. As principais categorias são: ${context.topCategories.join(', ') || 'diversas'}.`;
    }
    return `Olá! Sou o Assistente CasaControle da ${context.houseName}. Minha camada de inteligência com Gemini está pronta para ser ativada na próxima etapa para responder perguntas livres, ler notas fiscais e sugerir economias.`;
  }

  async parseReceiptImage(_imageBase64: string): Promise<ParsedReceiptResult> {
    throw new Error('A leitura automática de cupons fiscais via visão computacional do Gemini será ativada na próxima etapa.');
  }
}

/**
 * Provedor Google Gemini (Pronto para integração na Etapa 2 via API Key no backend)
 */
export class GeminiAiProvider implements IAiService {
  readonly providerName = 'Google Gemini 2.5 Flash';
  isReady: boolean = false;

  constructor(private apiKey?: string) {
    if (apiKey) {
      this.isReady = true;
    }
  }

  async analyzeConsumption(context: HouseAiContext, summary: string): Promise<AiAnalysisResult> {
    const fallback = new LocalRuleAiProvider();
    return fallback.analyzeConsumption(context, summary);
  }

  async analyzeExpenses(context: HouseAiContext, summary: string): Promise<AiAnalysisResult> {
    const fallback = new LocalRuleAiProvider();
    return fallback.analyzeExpenses(context, summary);
  }

  async askHouseAssistant(question: string, context: HouseAiContext): Promise<string> {
    const fallback = new LocalRuleAiProvider();
    return fallback.askHouseAssistant(question, context);
  }

  async parseReceiptImage(imageBase64: string): Promise<ParsedReceiptResult> {
    const fallback = new LocalRuleAiProvider();
    return fallback.parseReceiptImage(imageBase64);
  }
}

// Instância singleton gerenciada
let currentAiService: IAiService = new LocalRuleAiProvider();

export function getAiService(): IAiService {
  return currentAiService;
}

export function setAiProvider(provider: IAiService): void {
  currentAiService = provider;
}
