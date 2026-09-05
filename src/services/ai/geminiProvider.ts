/**
 * Provedor Oficial Google Gemini 2.5 Flash para CasaControle
 * 
 * Implementa o contrato AIProvider comunicando-se de forma segura através dos endpoints
 * server-side (/api/ai/*), suportando chave do ambiente (.env) ou informada pelo usuário em Configurações.
 */

import { 
  AIProvider, 
  AIHouseContext, 
  ParsedReceiptOutput, 
  AISuggestedRecipe, 
  AIConsumptionInsights, 
  AIChatMessage 
} from './types';
import { Product, Consumption, Recipe } from '../../types';

const STORAGE_KEY = 'casacontrole_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Erro ao persistir chave do Gemini localmente:', err);
  }
}

export function clearStoredGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silencioso
  }
}

export class GeminiAIProvider implements AIProvider {
  public readonly providerId = 'gemini-2.5-flash';
  public readonly providerName = 'Google Gemini 2.5 Flash';

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = getStoredGeminiApiKey();
    if (key) {
      headers['x-gemini-api-key'] = key;
    }
    return headers;
  }

  /**
   * Converte File ou Blob em string Base64 limpa
   */
  private async fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const mimeType = file.type || 'image/jpeg';
        resolve({ base64: result, mimeType });
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo da imagem.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Processar imagem de cupom fiscal com visão computacional multimodal do Gemini
   */
  public async parseReceipt(
    fileOrBase64: File | Blob | string,
    context?: AIHouseContext
  ): Promise<ParsedReceiptOutput> {
    let base64 = '';
    let mimeType = 'image/jpeg';

    if (typeof fileOrBase64 === 'string') {
      base64 = fileOrBase64;
    } else {
      const converted = await this.fileToBase64(fileOrBase64);
      base64 = converted.base64;
      mimeType = converted.mimeType;
    }

    try {
      const response = await fetch('/api/ai/parse-receipt', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          context,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 401 || errJson.isKeyError) {
          throw new Error('MISSING_KEY: Chave do Gemini ausente ou inválida. Por favor, adicione sua chave gratuita em Configurações.');
        }
        throw new Error(errJson.error || 'Não foi possível ler o cupom com o Gemini no momento.');
      }

      const result: ParsedReceiptOutput = await response.json();

      // Correlaciona itens extraídos com produtos já existentes na casa para facilitar o match
      if (context?.productsInStock && result.items) {
        result.items = result.items.map(item => {
          const itemLower = item.productName.toLowerCase();
          const matched = context.productsInStock.find(p => {
            const pLower = p.name.toLowerCase();
            return itemLower.includes(pLower) || pLower.includes(itemLower);
          });
          return {
            ...item,
            matchedProductId: matched?.id,
          };
        });
      }

      return result;
    } catch (err: any) {
      if (err.message?.includes('MISSING_KEY')) {
        throw err;
      }
      throw new Error(err.message || 'Não foi possível conectar ao assistente Gemini no momento. Suas funções normais de estoque continuam operando normalmente.');
    }
  }

  /**
   * Gera análise de consumo qualitativa e dicas de redução de desperdício
   */
  public async generateConsumptionInsights(
    stockData: Product[],
    consumptionHistory: Consumption[],
    houseName: string = 'Família'
  ): Promise<AIConsumptionInsights> {
    try {
      const response = await fetch('/api/ai/consumption-insights', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          stockData,
          consumptionHistory,
          houseName,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 401 || errJson.isKeyError) {
          throw new Error('MISSING_KEY: Configure sua chave gratuita do Google AI Studio em Configurações.');
        }
        throw new Error(errJson.error || 'Falha ao obter insights de consumo.');
      }

      return await response.json();
    } catch (err: any) {
      if (err.message?.includes('MISSING_KEY')) {
        throw err;
      }
      // Fallback gracioso sem quebrar o app
      return {
        summary: `Acompanhamento de estoque da casa ${houseName}.`,
        insights: [
          `${stockData.length} produtos monitorados pelo sistema determinístico.`,
          'O registro contínuo dos consumos garante a precisão do estoque sem surpresas.',
        ],
        recommendations: [
          'Priorize os produtos com alerta de estoque antes de ir às compras.',
          'Consulte a lista de receitas para aproveitar os itens disponíveis.',
        ],
        savingsTips: [
          'Evite compras por impulso comparando preços médios históricos.',
        ],
      };
    }
  }

  /**
   * Sugere até 3 receitas personalizadas com base no estoque real da despensa
   */
  public async suggestRecipesFromPantry(
    currentStock: Product[],
    existingRecipes: Recipe[] = []
  ): Promise<AISuggestedRecipe[]> {
    try {
      const response = await fetch('/api/ai/suggest-recipes', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          currentStock,
          existingRecipes,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 401 || errJson.isKeyError) {
          throw new Error('MISSING_KEY: Configure sua chave gratuita do Google AI Studio em Configurações para gerar receitas automáticas com IA.');
        }
        throw new Error(errJson.error || 'Falha ao sugerir receitas com Gemini.');
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (err: any) {
      if (err.message?.includes('MISSING_KEY')) {
        throw err;
      }
      throw new Error(err.message || 'Não foi possível conectar ao assistente Gemini no momento. Suas receitas normais continuam operando normalmente.');
    }
  }

  /**
   * Chat interativo com o Assistente Familiar
   */
  public async chatWithAssistant(
    messages: AIChatMessage[],
    context: AIHouseContext
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          messages,
          context,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 401 || errJson.isKeyError) {
          throw new Error('MISSING_KEY: Chave do Gemini não configurada. Por favor, adicione sua chave gratuita do Google AI Studio na aba Configurações.');
        }
        throw new Error(errJson.error || 'Erro ao conversar com o assistente.');
      }

      const data = await response.json();
      return data.reply;
    } catch (err: any) {
      if (err.message?.includes('MISSING_KEY')) {
        throw err;
      }
      return 'Não foi possível conectar ao assistente Gemini no momento. Suas funções normais de estoque e receitas continuam operando normalmente.';
    }
  }

  /**
   * Testa a conexão atual com o Gemini
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: this.getHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.error || 'Chave inválida ou serviço indisponível.' };
      }
      return { success: true, message: data.message || 'Conexão validada com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Não foi possível contactar o servidor.' };
    }
  }
}
