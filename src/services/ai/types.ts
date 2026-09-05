/**
 * CasaControle - Camada Abstrata de Inteligência Artificial
 * 
 * Regra Arquitetural Rigorosa:
 * A aplicação principal NUNCA depende diretamente do modelo de IA.
 * Toda comunicação com IA passa por esta interface provedora (AIProvider).
 * O motor determinístico de estoque, consumo e unidades NUNCA é delegado à IA.
 */

import { Product, Consumption, Purchase, Recipe } from '../../types';

export interface AIHouseContext {
  houseName: string;
  familyMembersCount: number;
  productsInStock: Product[];
  lowStockProducts: Product[];
  recentPurchases?: Purchase[];
  recentConsumptions?: Consumption[];
}

export interface ParsedReceiptItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  matchedProductId?: string;
}

export interface ParsedReceiptOutput {
  storeName: string;
  date: string;
  items: ParsedReceiptItem[];
  totalAmount?: number;
}

export interface AISuggestedRecipeIngredient {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit: string;
  is_optional: boolean;
}

export interface AISuggestedRecipe {
  name: string;
  description: string;
  prep_time_minutes: number;
  servings: number;
  ingredients: AISuggestedRecipeIngredient[];
  instructions: string[];
}

export interface AIConsumptionInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  savingsTips: string[];
}

export interface AIChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Contrato Oficial do Provedor de IA
 */
export interface AIProvider {
  readonly providerId: string;
  readonly providerName: string;

  /**
   * Processa imagem de cupom ou nota fiscal de supermercado via OCR Multimodal
   */
  parseReceipt(
    fileOrBase64: File | Blob | string,
    context?: AIHouseContext
  ): Promise<ParsedReceiptOutput>;

  /**
   * Gera análise qualitativa e dicas práticas de economia sem alterar o motor determinístico
   */
  generateConsumptionInsights(
    stockData: Product[],
    consumptionHistory: Consumption[],
    houseName?: string
  ): Promise<AIConsumptionInsights>;

  /**
   * Analisa a despensa e sugere receitas criativas adaptadas aos ingredientes em estoque
   */
  suggestRecipesFromPantry(
    currentStock: Product[],
    existingRecipes?: Recipe[]
  ): Promise<AISuggestedRecipe[]>;

  /**
   * Responde perguntas da família sobre a despensa, receitas e economia
   */
  chatWithAssistant(
    messages: AIChatMessage[],
    context: AIHouseContext
  ): Promise<string>;

  /**
   * Valida se a conexão com o provedor de IA está ativa e funcionando
   */
  testConnection(): Promise<{ success: boolean; message: string }>;
}
