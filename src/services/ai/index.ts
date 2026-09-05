/**
 * CasaControle - Serviço Central de Inteligência Artificial
 * 
 * Padrão Factory / Adapter:
 * Fornece a instância singleton ativa do AIProvider (GeminiAIProvider).
 * As chamadas respeitam o isolamento de chaves e nunca alteram o motor determinístico.
 */

import { AIProvider } from './types';
import { GeminiAIProvider } from './geminiProvider';

export * from './types';
export * from './geminiProvider';

let activeProvider: AIProvider = new GeminiAIProvider();

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}
