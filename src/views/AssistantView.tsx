import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  ChefHat, 
  AlertTriangle, 
  TrendingDown, 
  FileText, 
  Plus, 
  Check, 
  Loader2, 
  RefreshCw,
  Clock,
  Users,
  Lightbulb,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Product, Consumption, Purchase, Recipe, UserMember } from '../types';
import { 
  getAIProvider, 
  AIChatMessage, 
  AIHouseContext, 
  AISuggestedRecipe,
  getStoredGeminiApiKey 
} from '../services/ai';

interface AssistantViewProps {
  products: Product[];
  consumptions: Consumption[];
  purchases: Purchase[];
  recipes: Recipe[];
  members: UserMember[];
  houseName: string;
  onSaveRecipe: (recipeData: any) => Promise<void>;
  onNavigateTab: (tab: any) => void;
  onOpenSettings: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  products,
  consumptions,
  purchases,
  recipes,
  members,
  houseName,
  onSaveRecipe,
  onNavigateTab,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou o Assistente Familiar do CasaControle para a ${houseName} 🏠.
Estou conectado à sua despensa (${products.length} produtos monitorados) e posso te ajudar a:
- Sugerir refeições práticas com o que você já tem em casa;
- Apontar o que está perto do vencimento ou acumulado;
- Analisar a média de consumo e dar ideias para economizar nas compras.

O que você gostaria de ver hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Smart Recipe Suggestions Drawer/Cards
  const [suggestedRecipes, setSuggestedRecipes] = useState<AISuggestedRecipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [savedRecipeIndices, setSavedRecipeIndices] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check API key configuration
  useEffect(() => {
    async function checkKey() {
      try {
        const res = await fetch('/api/ai/status', {
          headers: {
            'x-gemini-api-key': getStoredGeminiApiKey(),
          }
        });
        const data = await res.json();
        setHasApiKey(data.configured);
      } catch {
        setHasApiKey(Boolean(getStoredGeminiApiKey()));
      }
    }
    checkKey();
  }, []);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Audio Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          setIsListening(false);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Seu navegador não suporta reconhecimento de fala. Você pode digitar sua pergunta normalmente.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Erro ao iniciar microfone:', err);
      }
    }
  };

  const buildContext = (): AIHouseContext => {
    return {
      houseName,
      familyMembersCount: members.length || 1,
      productsInStock: products,
      lowStockProducts: products.filter(p => p.current_stock <= p.min_stock_alert),
      recentPurchases: purchases.slice(0, 10),
      recentConsumptions: consumptions.slice(0, 20),
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const provider = getAIProvider();
      const reply = await provider.chatWithAssistant(
        [...messages, userMsg],
        buildContext()
      );

      const assistantMsg: AIChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Não foi possível conectar ao assistente Gemini no momento. Suas funções normais de estoque e receitas continuam operando normalmente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePantryRecipes = async () => {
    setIsGeneratingRecipes(true);
    setSuggestedRecipes([]);
    setSavedRecipeIndices(new Set());

    try {
      const provider = getAIProvider();
      const results = await provider.suggestRecipesFromPantry(products, recipes);
      setSuggestedRecipes(results);
    } catch (err: any) {
      alert(err.message || 'Erro ao sugerir receitas com Gemini.');
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleSaveAISuggestion = async (recipe: AISuggestedRecipe, index: number) => {
    setSavingIndex(index);
    try {
      await onSaveRecipe({
        name: recipe.name,
        description: recipe.description,
        prep_time_minutes: recipe.prep_time_minutes,
        servings: recipe.servings,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map(ing => ({
          product_id: ing.product_id,
          product_name: ing.product_name,
          quantity: ing.quantity,
          unit: ing.unit,
          is_optional: ing.is_optional,
        })),
      });

      setSavedRecipeIndices(prev => new Set(prev).add(index));
      showToast('Receita adicionada com sucesso ao caderno da família!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar receita na lista da família.');
    } finally {
      setSavingIndex(null);
    }
  };

  const quickChips = [
    { label: '💡 Sugira um jantar para hoje', query: 'Com base no que temos na despensa hoje, o que você sugere para um jantar prático e saboroso?' },
    { label: '⚠️ O que está acumulado sem consumo?', query: 'Quais produtos estão na despensa há muito tempo sem consumo ou com estoque alto?' },
    { label: '📝 Resuma o consumo da semana', query: 'Faça um resumo acolhedor dos nossos hábitos de consumo recentes e como podemos evitar desperdício.' },
    { label: '🍳 Receitas rápidas de 20 min', query: 'Quais receitas rápidas de até 20 minutos podemos preparar com os ingredientes atuais?' },
  ];

  return (
    <div className="space-y-6 pb-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/90 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl text-sm border border-white/20 animate-fade-in flex items-center gap-2 max-w-sm">
          <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                Assistente da Casa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
                Google Gemini
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Inteligência generativa conectada à realidade da despensa e às receitas da família.
            </p>
          </div>
        </div>

        {/* Gerar Receitas Button */}
        <button
          onClick={handleGeneratePantryRecipes}
          disabled={isGeneratingRecipes}
          className="bg-white/80 hover:bg-white text-slate-800 border border-slate-200 hover:border-rose-300 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50"
        >
          {isGeneratingRecipes ? (
            <>
              <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
              <span>Criando receitas com a despensa...</span>
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4 text-rose-500" />
              <span>✨ Criar 3 Receitas com a Despensa</span>
            </>
          )}
        </button>
      </div>

      {/* API Key Missing Alert Notice */}
      {hasApiKey === false && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Chave do Google AI Studio em modo Standby</p>
              <p className="text-amber-700 text-xs">
                Cadastre sua chave gratuita de API nas Configurações para ativar as respostas inteligentes do Gemini.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shrink-0"
          >
            ⚙️ Configurar Chave Gratuita
          </button>
        </div>
      )}

      {/* Suggested Recipes from Pantry Section (If active) */}
      {suggestedRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-rose-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Receitas Criativas Sugeridas pelo Gemini
              </h2>
            </div>
            <button
              onClick={() => setSuggestedRecipes([])}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Fechar sugestões
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedRecipes.map((rec, idx) => {
              const isSaved = savedRecipeIndices.has(idx);
              const isSaving = savingIndex === idx;

              return (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[2rem] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        {rec.prep_time_minutes} min • {rec.servings} porções
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base leading-snug">
                      {rec.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {rec.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Ingredientes Utilizados:
                      </p>
                      <ul className="text-xs text-slate-600 space-y-0.5">
                        {rec.ingredients.slice(0, 4).map((ing, i) => (
                          <li key={i} className="truncate">
                            • {ing.quantity} {ing.unit} de {ing.product_name}
                          </li>
                        ))}
                        {rec.ingredients.length > 4 && (
                          <li className="text-[10px] text-slate-400">
                            + {rec.ingredients.length - 4} outros ingredientes
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveAISuggestion(rec, idx)}
                    disabled={isSaved || isSaving}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      isSaved
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando na Casa...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Salva em Minhas Receitas!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>➕ Salvar em Minhas Receitas</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(chip.query)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white text-slate-700 text-xs font-semibold border border-white/80 shadow-xs shrink-0 hover:scale-105 active:scale-95 transition disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-4 sm:p-6 shadow-sm flex flex-col h-[520px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xs text-xs font-bold shrink-0 mt-0.5">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-lg p-4 rounded-3xl text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-rose-500 text-white rounded-br-xs font-medium'
                      : 'bg-white/90 text-slate-800 border border-white/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-rose-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    👤
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs text-xs shrink-0">
                🤖
              </div>
              <div className="bg-white/90 border border-white/80 p-3.5 rounded-2xl text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                <span>O Assistente Gemini está consultando sua despensa...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice & Send */}
        <div className="pt-4 border-t border-rose-100/50 flex items-center gap-2">
          {/* Audio / Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Parar gravação' : 'Falar por áudio com o Assistente'}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-bounce shadow-md shadow-rose-300'
                : 'bg-white hover:bg-rose-50 text-slate-600 border border-slate-200'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={isListening ? 'Ouvindo sua voz...' : 'Pergunte sobre receitas, o que cozinhar, estoque ou gastos...'}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-slate-400"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white flex items-center justify-center shadow-md shadow-rose-200 disabled:opacity-40 active:scale-95 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
