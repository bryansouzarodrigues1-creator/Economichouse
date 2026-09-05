import { GoogleGenAI, Type } from '@google/genai';
import { Product, Consumption, Recipe } from '../src/types';

export const GEMINI_MODEL = 'gemini-3.6-flash';

/**
 * Lazy initialization of GoogleGenAI client.
 * Prioritizes the key provided in request headers (e.g. x-gemini-api-key),
 * then falls back to process.env.GEMINI_API_KEY.
 */
export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_API_KEY: Nenhuma chave da API Gemini foi configurada no servidor ou nas configurações.');
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

export function isGeminiConfigured(customApiKey?: string): boolean {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

export interface ParsedReceiptItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceiptOutput {
  storeName: string;
  date: string;
  items: ParsedReceiptItem[];
}

/**
 * Process receipt image using gemini-2.5-flash with structured JSON output.
 */
export async function parseReceiptWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  customApiKey?: string
): Promise<ParsedReceiptOutput> {
  const ai = getGeminiClient(customApiKey);

  // Clean base64 string if it has data URL prefix
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

  const prompt = `Analise cuidadosamente esta imagem de nota fiscal ou cupom fiscal de compras (supermercado, mercearia, farmácia, etc.).
Extraia:
1. storeName: Nome do estabelecimento comercial (ou "Supermercado" caso ilegível).
2. date: Data da compra no formato AAAA-MM-DD (ex: 2026-09-05). Se não houver ano explícito, utilize o ano corrente.
3. items: Lista detalhada de todos os produtos comprados.
Para cada item:
  - productName: Nome limpo e legível do produto em português (ex: "Arroz Branco Tipo 1 5kg", "Leite Integral 1L").
  - quantity: Quantidade numérica (ex: 1, 2, 0.750). Se não especificado, use 1.
  - unit: Unidade de medida padronizada (kg, g, L, ml, unidade, pacote, dúzia).
  - unitPrice: Preço unitário numérico em Reais (ex: 5.99).
  - totalPrice: Preço total do item numérico em Reais (ex: 11.98).

Se houver itens com descontos ou pesagem por quilo, calcule a quantidade e o valor final correto.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      prompt,
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storeName: { type: Type.STRING },
          date: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                unitPrice: { type: Type.NUMBER },
                totalPrice: { type: Type.NUMBER },
              },
              required: ['productName', 'quantity', 'unit', 'unitPrice', 'totalPrice'],
            },
          },
        },
        required: ['storeName', 'date', 'items'],
      },
    },
  });

  const text = response.text || '{}';
  try {
    const parsed = JSON.parse(text);
    return {
      storeName: parsed.storeName || 'Supermercado',
      date: parsed.date || new Date().toISOString().slice(0, 10),
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (err) {
    throw new Error('Falha ao processar o formato retornado pelo Gemini para a nota fiscal.');
  }
}

/**
 * Natural language chat with House Assistant.
 */
export async function chatWithHouseAssistant(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  context: {
    houseName: string;
    productsInStock: Product[];
    lowStockProducts: Product[];
    recentConsumptions?: Consumption[];
  },
  customApiKey?: string
): Promise<string> {
  const ai = getGeminiClient(customApiKey);

  const stockSummary = context.productsInStock.map(p => 
    `- ${p.name}: ${p.current_stock} ${p.unit} (estoque mínimo: ${p.min_stock_alert} ${p.unit})`
  ).join('\n');

  const lowStockSummary = context.lowStockProducts.map(p => 
    `- ${p.name}: apenas ${p.current_stock} ${p.unit} restantes`
  ).join('\n') || 'Nenhum produto em nível crítico no momento.';

  const systemInstruction = `Você é o "Assistente Familiar do CasaControle", um conselheiro atencioso, acolhedor e altamente prático de organização doméstica e economia para a família da casa "${context.houseName}".

DIRETRIZES DE ATUAÇÃO:
1. Você tem acesso em tempo real à despensa da casa:
PRODUTOS EM ESTOQUE ATUAL:
${stockSummary || 'Nenhum produto cadastrado no estoque ainda.'}

PRODUTOS EM FALTA OU BAIXO ESTOQUE:
${lowStockSummary}

2. Responda em Português do Brasil com tom simpático, caloroso e encorajador. Seja direto e objetivo, sem enrolação.
3. Se perguntarem "o que posso cozinhar com o que tenho?", priorize estritamente ingredientes disponíveis no estoque atual listado acima.
4. Ao dar dicas de economia ou desperdício, sugira como aproveitar sobras ou usar primeiro os produtos que já estão na casa.
5. Formate respostas com tópicos claros, emojis amigáveis e destaque valores numéricos com precisão.`;

  // Filter messages for Gemini format
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: geminiContents,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || 'Desculpe, não consegui formular uma resposta no momento.';
}

export interface SuggestedRecipeOutput {
  name: string;
  description: string;
  prep_time_minutes: number;
  servings: number;
  ingredients: {
    product_id?: string;
    product_name: string;
    quantity: number;
    unit: string;
    is_optional: boolean;
  }[];
  instructions: string[];
}

/**
 * Generate smart recipe suggestions based on current pantry stock.
 */
export async function suggestRecipesFromPantry(
  currentStock: Product[],
  existingRecipes: Recipe[] = [],
  customApiKey?: string
): Promise<SuggestedRecipeOutput[]> {
  const ai = getGeminiClient(customApiKey);

  const pantryList = currentStock
    .filter(p => p.current_stock > 0)
    .map(p => ({ id: p.id, name: p.name, stock: p.current_stock, unit: p.unit }));

  const existingNames = existingRecipes.map(r => r.name).join(', ');

  const prompt = `Analise os produtos disponíveis na despensa da família e crie até 3 sugestões de receitas deliciosas, fáceis e caseiras que aproveitem ao máximo o que já temos em casa, evitando desperdício.

PRODUTOS DISPONÍVEIS NA DESPENSA:
${JSON.stringify(pantryList, null, 2)}

RECEITAS JÁ CADASTRADAS PELA FAMÍLIA (evite sugerir pratos idênticos):
${existingNames || 'Nenhuma'}

REGRAS:
1. Cada receita deve priorizar os ingredientes listados. Se um ingrediente já existir na despensa, preencha "product_id" com o respectivo id e "product_name" com o nome idêntico.
2. Ingredientes básicos comuns (como sal, água, pimenta) podem ser incluídos com is_optional: true ou como ingredientes adicionais.
3. Forneça modo de preparo passo a passo em tópicos numerados claros.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            prep_time_minutes: { type: Type.NUMBER },
            servings: { type: Type.NUMBER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  product_id: { type: Type.STRING },
                  product_name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  is_optional: { type: Type.BOOLEAN },
                },
                required: ['product_name', 'quantity', 'unit', 'is_optional'],
              },
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['name', 'description', 'prep_time_minutes', 'servings', 'ingredients', 'instructions'],
        },
      },
    },
  });

  const text = response.text || '[]';
  try {
    const list = JSON.parse(text);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    throw new Error('Falha ao processar as receitas sugeridas pelo Gemini.');
  }
}

/**
 * Generate qualitative consumption and savings insights.
 */
export async function generateConsumptionInsightsWithGemini(
  stockData: Product[],
  consumptionHistory: Consumption[],
  houseName: string = 'Família',
  customApiKey?: string
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  savingsTips: string[];
}> {
  const ai = getGeminiClient(customApiKey);

  const prompt = `Analise os hábitos de consumo e o estoque da casa "${houseName}".
Dados de estoque atual: ${stockData.length} produtos monitorados.
Histórico recente de consumos registrados: ${consumptionHistory.length} registros.

Responda como um assistente atencioso de organização doméstica. Apresente ideias práticas para evitar desperdício e sugestões de otimização de compras sem termos técnicos complexos.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          savingsTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['summary', 'insights', 'recommendations', 'savingsTips'],
      },
    },
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Falha ao processar insights de consumo com Gemini.');
  }
}
