import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  Sparkles, 
  Flame, 
  Clock, 
  Users, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2,
  Lock,
  MessageSquare,
  HelpCircle,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { Product, Recipe, House, UserMember } from '../types';
import { calculateRecipeAvailability } from '../utils/recipeEngine';
import { formatUnitDisplay } from '../utils/units';

interface ChefIaModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: House;
  products: Product[];
  members: UserMember[];
  activeMemberId?: string;
  onPrepareRecipe: (recipeId: string, servings: number, memberId?: string) => Promise<void>;
  onSaveRecipe: (recipeData: Omit<Recipe, 'id' | 'house_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onOpenProModal: () => void;
}

export const ChefIaModal: React.FC<ChefIaModalProps> = ({
  isOpen,
  onClose,
  house,
  products,
  members,
  activeMemberId,
  onPrepareRecipe,
  onSaveRecipe,
  onOpenProModal,
}) => {
  const [activeMode, setActiveMode] = useState<'guided' | 'free'>('guided');
  
  // Guided mode states
  const [step, setStep] = useState<number>(1);
  const [complexity, setComplexity] = useState<'simple' | 'elaborate'>('simple');
  const [mealType, setMealType] = useState<string>('Almoço');
  const [servings, setServings] = useState<number>(4);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Free mode states
  const [freePrompt, setFreePrompt] = useState<string>('');

  // Status de geração e cota
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = house.plan === 'pro';
  const todayStr = new Date().toISOString().split('T')[0];
  const quotaKey = `marketbuy_chef_ia_date_${house.id}`;

  const [hasUsedFreeToday, setHasUsedFreeToday] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedDate = localStorage.getItem(quotaKey);
      setHasUsedFreeToday(!isPro && storedDate === todayStr);
      setErrorMessage(null);
    }
  }, [isOpen, isPro, todayStr, quotaKey]);

  if (!isOpen) return null;

  // Produtos com estoque positivo para sugerir
  const inStockProducts = products.filter(p => p.current_stock > 0);

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerateRecipe = async () => {
    if (!isPro && hasUsedFreeToday) {
      onOpenProModal();
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGeneratedRecipe(null);
      setIsPrepared(false);
      setIsSaved(false);

      const requestBody = {
        currentStock: inStockProducts,
        mode: activeMode,
        guidedAnswers: activeMode === 'guided' ? {
          complexity: complexity === 'simple' ? '1. Muito simples (ex: Linguiça frita, Omelete)' : '2. Elaborado (ex: Macarrão com queijo ao forno)',
          mealType,
          servings,
          prioritizedProducts: selectedProductIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean)
        } : undefined,
        freePrompt: activeMode === 'free' ? freePrompt : undefined,
      };

      let recipeResult: Recipe | null = null;

      try {
        const res = await fetch('/api/ai/suggest-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            const first = data.suggestions[0];
            recipeResult = {
              id: `recipe-ai-${Date.now()}`,
              house_id: house.id,
              name: first.name,
              description: first.description,
              prep_time_minutes: first.prep_time_minutes || 25,
              servings: first.servings || servings,
              instructions: first.instructions || [],
              ingredients: (first.ingredients || []).map((ing: any, idx: number) => {
                const matched = products.find(p => p.id === ing.product_id || p.name.toLowerCase() === ing.product_name.toLowerCase());
                return {
                  id: `ing-${idx}`,
                  recipe_id: `recipe-ai-${Date.now()}`,
                  product_id: matched ? matched.id : (ing.product_id || products[0]?.id || 'prod-default'),
                  product_name: ing.product_name || matched?.name || 'Ingrediente',
                  quantity: ing.quantity || 1,
                  unit: ing.unit || matched?.unit || 'unidade',
                  is_optional: Boolean(ing.is_optional),
                };
              }),
              created_by_member_id: activeMemberId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }
      } catch (networkErr) {
        console.warn('API de IA indisponível, gerando via motor heurístico:', networkErr);
      }

      // Se a API não respondeu ou não tem chave configurada, geramos deterministicamente
      if (!recipeResult) {
        recipeResult = generateFallbackRecipe();
      }

      setGeneratedRecipe(recipeResult);

      // Marca a cota diária se for plano gratuito
      if (!isPro) {
        localStorage.setItem(quotaKey, todayStr);
        setHasUsedFreeToday(true);
      }
    } catch (err: any) {
      console.error('Erro ao gerar receita com IA:', err);
      setErrorMessage(err.message || 'Não foi possível gerar a receita neste momento.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Gerador determinístico inteligente como salvaguarda
  const generateFallbackRecipe = (): Recipe => {
    const isSimple = complexity === 'simple';
    const chosenProducts = selectedProductIds.length > 0 
      ? products.filter(p => selectedProductIds.includes(p.id))
      : inStockProducts.slice(0, 4);

    let name = '';
    let description = '';
    let instructions: string[] = [];

    if (activeMode === 'free' && freePrompt.trim()) {
      name = `Especial do Chef: ${freePrompt.slice(0, 32)}...`;
      description = `Receita customizada com base no seu pedido: "${freePrompt}" aproveitando os ingredientes da sua despensa.`;
    } else if (isSimple) {
      name = chosenProducts.length > 0 
        ? `Prato Rápido de ${chosenProducts[0].name} com Toque do Chef`
        : 'Omelete Recheada da Casa';
      description = 'Receita rápida, muito simples e direta, pronta em menos de 20 minutos sem sujeira.';
      instructions = [
        'Aqueça uma frigideira com um fio de azeite ou óleo.',
        `Pique os ingredientes (${chosenProducts.map(p => p.name).join(', ')}) em porções uniformes.`,
        'Refogue os ingredientes principais até dourarem.',
        'Ajuste o sal e temperos a gosto e sirva imediatamente bem quente.'
      ];
    } else {
      name = chosenProducts.length > 0 
        ? `${chosenProducts[0].name} Especial Gratinado ao Forno`
        : 'Massa Especial Gratinada ao Forno';
      description = 'Receita elaborada, suculenta e perfeita para uma refeição marcante com a família.';
      instructions = [
        'Pré-aqueça o forno a 200°C.',
        `Em uma panela, prepare a base refogando os ingredientes da despensa (${chosenProducts.map(p => p.name).join(', ')}).`,
        'Monte em um refratário camadas com o molho e ingredientes.',
        'Leve ao forno por aproximadamente 25 a 30 minutos até borbulhar e dourar a superfície.',
        'Deixe descansar por 5 minutos antes de servir.'
      ];
    }

    return {
      id: `recipe-ai-${Date.now()}`,
      house_id: house.id,
      name,
      description,
      prep_time_minutes: isSimple ? 15 : 40,
      servings,
      instructions,
      ingredients: chosenProducts.map((p, idx) => ({
        id: `ing-fallback-${idx}`,
        recipe_id: `recipe-ai-${Date.now()}`,
        product_id: p.id,
        product_name: p.name,
        quantity: isSimple ? 1 : 2,
        unit: p.unit,
        is_optional: false,
      })),
      created_by_member_id: activeMemberId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handlePrepare = async () => {
    if (!generatedRecipe) return;
    try {
      await onPrepareRecipe(generatedRecipe.id, generatedRecipe.servings || servings, activeMemberId);
      setIsPrepared(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao preparar receita.');
    }
  };

  const handleSaveToBook = async () => {
    if (!generatedRecipe) return;
    try {
      await onSaveRecipe({
        name: generatedRecipe.name,
        description: generatedRecipe.description,
        prep_time_minutes: generatedRecipe.prep_time_minutes,
        servings: generatedRecipe.servings,
        instructions: generatedRecipe.instructions,
        ingredients: generatedRecipe.ingredients,
        created_by_member_id: activeMemberId,
      });
      setIsSaved(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar receita.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-2xl w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Premium com Estilo Chef IA */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 shrink-0 font-bold">
              🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Chef IA MarketBuy
                </h2>
                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                  isPro ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isPro ? 'Pro Ilimitado' : 'Plano Gratuito'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gere receitas inteligentes aproveitando exatamente o que já está na sua despensa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Cota Diária do Plano Free */}
        {!isPro && hasUsedFreeToday && !generatedRecipe && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Limite do Plano Gratuito atingido:</strong> Você já gerou sua 1 receita gratuita de hoje.
              </span>
            </div>
            <button
              onClick={onOpenProModal}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 hover:bg-black transition active:scale-95 flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Desbloquear PRO</span>
            </button>
          </div>
        )}

        {/* Alternador de Modos: Guiado vs Descritivo Livre */}
        {!generatedRecipe && (
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-center gap-2 shrink-0">
            <button
              onClick={() => setActiveMode('guided')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                activeMode === 'guided'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Guiado (Perguntas)</span>
            </button>

            <button
              onClick={() => setActiveMode('free')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                activeMode === 'free'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Modo Descritivo Livre</span>
            </button>
          </div>
        )}

        {/* Conteúdo Principal do Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. SE UMA RECEITA JÁ FOI GERADA */}
          {generatedRecipe ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-3xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      Sugestão do Chef IA
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5 leading-snug">
                      {generatedRecipe.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {generatedRecipe.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-emerald-200/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    {generatedRecipe.prep_time_minutes} minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    {generatedRecipe.servings} porções
                  </span>
                </div>
              </div>

              {/* Ingredientes Utilizados da Despensa */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ingredientes da Despensa:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedRecipe.ingredients?.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{ing.product_name}</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modo de Preparo Passo a Passo */}
              {generatedRecipe.instructions && generatedRecipe.instructions.length > 0 && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Modo de Preparo:
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-700">
                    {generatedRecipe.instructions.map((inst, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Ações: Preparar Receita (Desconta Estoque) & Salvar no Livro */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                {isPrepared ? (
                  <div className="p-3 rounded-2xl bg-emerald-100/80 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Receita preparada! Os ingredientes foram descontados do estoque da Despensa.</span>
                  </div>
                ) : (
                  <button
                    onClick={handlePrepare}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-700 hover:to-black text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>🍳 Preparar Receita (Descontar da Despensa)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToBook}
                    disabled={isSaved}
                    className={`flex-1 py-2.5 rounded-full font-bold text-xs transition border ${
                      isSaved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSaved ? '✓ Salva no Livro de Receitas' : '💾 Guardar no Livro de Receitas'}
                  </button>

                  <button
                    onClick={() => {
                      setGeneratedRecipe(null);
                      setIsPrepared(false);
                      setIsSaved(false);
                    }}
                    className="py-2.5 px-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                  >
                    Nova Consulta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 2. FORMULÁRIO DE SELEÇÃO: MODO GUIADO OU MODO LIVRE */
            <div className="space-y-5">
              {activeMode === 'guided' ? (
                /* MODO GUIADO (PERGUNTAS DINÂMICAS) */
                <div className="space-y-4">
                  {/* Pergunta 1: Nível de Complexidade */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      1. Qual o nível de complexidade para hoje?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setComplexity('simple')}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          complexity === 'simple'
                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">1. Muito Simples</span>
                          <span className="text-lg">⚡</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Pratos rápidos e práticos (ex: Linguiça frita, omelete de frigideira, arroz com ovos).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setComplexity('elaborate')}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          complexity === 'elaborate'
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">2. Elaborado</span>
                          <span className="text-lg">🍲</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Refeições marcantes (ex: Macarrão com queijo ao forno, ensopado especial, risoto).
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Pergunta 2: Momento / Tipo de Refeição */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      2. Qual é a refeição?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Almoço', 'Jantar', 'Lanche Rápido', 'Sobremesa'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMealType(t)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                            mealType === t
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pergunta 3: Quantidade de Pessoas */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      3. Para quantas pessoas?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1 a 2 pessoas', val: 2 },
                        { label: '3 a 4 pessoas', val: 4 },
                        { label: '5+ pessoas', val: 6 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setServings(item.val)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                            servings === item.val
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pergunta 4: Priorizar itens da despensa */}
                  {inStockProducts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        4. Deseja priorizar algum ingrediente da sua despensa? (Opcional)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                        {inStockProducts.map((p) => {
                          const isSel = selectedProductIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleToggleProduct(p.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                                isSel
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                              <span>{p.name} ({p.current_stock} {p.unit})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* MODO DESCRITIVO LIVRE */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Descreva livremente o que deseja preparar:
                    </label>
                    <textarea
                      value={freePrompt}
                      onChange={(e) => setFreePrompt(e.target.value)}
                      placeholder="Ex: Quero um jantar bem reconfortante e quentinho aproveitando o arroz que sobrou de ontem, ovos e queijo..."
                      rows={4}
                      className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                  </div>

                  {/* Sugestões de Inspiração */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Inspirações rápidas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Almoço rápido em menos de 15 minutos',
                        'Sobremesa gelada com leite condensado',
                        'Refeição pós-treino rica em proteínas',
                        'Jantar leve sem sujar muita louça',
                      ].map((insp) => (
                        <button
                          key={insp}
                          type="button"
                          onClick={() => setFreePrompt(insp)}
                          className="px-3 py-1 rounded-full text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                        >
                          {insp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botão de Disparo */}
              <button
                onClick={handleGenerateRecipe}
                disabled={isGenerating || (!isPro && hasUsedFreeToday)}
                className={`w-full py-4 rounded-full font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                  !isPro && hasUsedFreeToday
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 hover:from-black hover:to-emerald-950 text-white shadow-slate-900/20'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>O Chef IA está analisando sua despensa...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Gerar Sugestão de Receita com IA</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
