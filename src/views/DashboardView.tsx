import React, { useState, useMemo } from 'react';
import { 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  Plus, 
  Minus,
  ArrowRight,
  ShoppingBag,
  ChefHat,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock
} from 'lucide-react';
import { Product, Consumption, Purchase, Category, UserMember, Recipe } from '../types';
import { calculateProductMetrics, calculateMonthlyComparison, formatCurrency, formatQuantityWithUnit } from '../utils/mathEngine';
import { calculateRecipeAvailability } from '../utils/recipeEngine';

interface DashboardViewProps {
  products: Product[];
  consumptions: Consumption[];
  purchases: Purchase[];
  categories: Category[];
  members: UserMember[];
  recipes?: Recipe[];
  activeMember?: UserMember;
  onNavigateTab: (tab: any) => void;
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
  onOpenNewProduct: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  consumptions,
  purchases,
  categories,
  members,
  recipes = [],
  activeMember,
  onNavigateTab,
  onOpenQuickAction,
  onOpenNewProduct,
}) => {
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilterStatus, setStockFilterStatus] = useState<'all' | 'red' | 'amber' | 'emerald'>('all');

  // Cálculos determinísticos para cada produto
  const productMetrics = useMemo(() => {
    return products.map(p => ({
      product: p,
      metrics: calculateProductMetrics(p, consumptions),
    }));
  }, [products, consumptions]);

  const buyNowList = useMemo(() => {
    return productMetrics.filter(pm => pm.metrics.recommendation.status === 'buy_now');
  }, [productMetrics]);

  const buySoonList = useMemo(() => {
    return productMetrics.filter(pm => pm.metrics.recommendation.status === 'buy_soon');
  }, [productMetrics]);

  const dontBuyList = useMemo(() => {
    return productMetrics.filter(pm => pm.metrics.recommendation.status === 'dont_buy');
  }, [productMetrics]);

  // Cálculos de receitas disponíveis no estoque
  const readyRecipesCount = recipes.filter(r => {
    const avail = calculateRecipeAvailability(r, products);
    return avail.status === 'can_make_now';
  }).length;

  const missingOneRecipeCount = recipes.filter(r => {
    const avail = calculateRecipeAvailability(r, products);
    return avail.status === 'missing_one';
  }).length;

  // Comparação de gastos do mês atual vs anterior
  const monthlyComp = calculateMonthlyComparison(purchases);

  // Data formatada amigável em português
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const getProductEmoji = (name: string, categoryName?: string): string => {
    const n = name.toLowerCase();
    const c = (categoryName || '').toLowerCase();
    if (n.includes('arroz')) return '🍚';
    if (n.includes('feij')) return '🫘';
    if (n.includes('leite')) return '🥛';
    if (n.includes('café') || n.includes('cafe')) return '☕';
    if (n.includes('pão') || n.includes('pao')) return '🍞';
    if (n.includes('óleo') || n.includes('oleo') || n.includes('azeite')) return '🫒';
    if (n.includes('açúcar') || n.includes('acucar')) return '🧂';
    if (n.includes('macarrão') || n.includes('massa')) return '🍝';
    if (n.includes('papel') || n.includes('higiênico') || n.includes('higienico')) return '🧻';
    if (n.includes('detergente') || n.includes('sabão') || n.includes('sabao') || n.includes('amaciante')) return '🧼';
    if (n.includes('sabonete') || n.includes('shampoo') || n.includes('pasta') || n.includes('creme')) return '🧴';
    if (n.includes('frango') || n.includes('carne') || n.includes('bife')) return '🥩';
    if (n.includes('ovo')) return '🥚';
    if (c.includes('limpeza')) return '🧹';
    if (c.includes('higiene')) return '🪥';
    if (c.includes('padaria')) return '🥖';
    if (c.includes('aliment')) return '🥫';
    return '📦';
  };

  // Filtragem do Resumo Visual do Estoque
  const filteredStock = useMemo(() => {
    return productMetrics.filter(({ product, metrics }) => {
      const matchesSearch = product.name.toLowerCase().includes(stockSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (stockFilterStatus === 'all') return true;
      return metrics.recommendation.color === stockFilterStatus;
    });
  }, [productMetrics, stockSearch, stockFilterStatus]);

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Saudação Familiar Acolhedora em Frosted Glass */}
      <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 sm:p-6 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 capitalize">
              {todayFormatted}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight mt-0.5">
              Olá, {activeMember?.name?.split(' ')[0] || 'Membro'}!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 max-w-xl">
              Visão geral, previsão de reposição e inventário da residência.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
              {products.length} itens na despensa
            </span>
          </div>
        </div>
      </div>

      {/* 2. OS 3 GRANDES BOTÕES DE AÇÕES RÁPIDAS */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Ações Rápidas da Residência
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Botão 1: [- Item Consumido] */}
          <button
            onClick={() => onOpenQuickAction('consumption')}
            id="dash-btn-retirar"
            className="group relative bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-98 text-white rounded-[2rem] p-5 sm:p-6 shadow-lg shadow-rose-500/25 transition-all text-left flex flex-col justify-between min-h-[135px] border border-rose-400/40"
            title="Dar baixa rápida ao consumir ou usar um produto"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-xl font-black shadow-inner">
                <Minus className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-xs font-bold bg-white/25 px-2.5 py-1 rounded-full text-white backdrop-blur-xs">
                Consumo
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                - Item Consumido
              </h3>
              <p className="text-xs text-rose-100/90 font-medium mt-0.5">
                Dar baixa rápida em produto do estoque
              </p>
            </div>
          </button>

          {/* Botão 2: [+ Confirmar Compra] */}
          <button
            onClick={() => onOpenQuickAction('purchase')}
            id="dash-btn-entrada"
            className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white rounded-[2rem] p-5 sm:p-6 shadow-lg shadow-emerald-500/25 transition-all text-left flex flex-col justify-between min-h-[135px] border border-emerald-400/40"
            title="Adicionar o que chegou das compras ao estoque"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-xl font-black shadow-inner">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-xs font-bold bg-white/25 px-2.5 py-1 rounded-full text-white backdrop-blur-xs">
                Entrada
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                + Confirmar Compra
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Registrar novas compras no estoque
              </p>
            </div>
          </button>

          {/* Botão 3: [🛒 Lista de Compras] */}
          <button
            onClick={() => onNavigateTab('shopping_list')}
            id="dash-btn-comprar"
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 active:scale-98 text-white rounded-[2rem] p-5 sm:p-6 shadow-lg shadow-slate-900/25 transition-all text-left flex flex-col justify-between min-h-[135px] border border-slate-700/50"
            title="Ver lista de compras com cálculo determinístico de consumo"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-amber-400 text-xl font-black shadow-inner">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-xs ${
                buyNowList.length > 0 ? 'bg-rose-500/80 animate-pulse' : 'bg-white/15'
              }`}>
                {buyNowList.length > 0 ? `${buyNowList.length} precisando urgente` : 'Despensa em dia'}
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                🛒 Lista de Compras
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Reposição inteligente calculada por taxa de uso
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. RESUMO SIMPLES E VISUAL DO ESTOQUE (Ex: Arroz - 2 kg 🟢 | Feijão - 0.5 kg 🔴) */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white/50 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Resumo Visual da Despensa
              </h2>
              <span className="text-xs font-bold text-slate-400">
                ({filteredStock.length} de {products.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toque em qualquer produto para ver ou dar baixa imediata.
            </p>
          </div>

          {/* Legenda Visual Simples */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setStockFilterStatus(stockFilterStatus === 'red' ? 'all' : 'red')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-bold ${
                stockFilterStatus === 'red'
                  ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-rose-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Acabando ({buyNowList.length})</span>
            </button>

            <button
              onClick={() => setStockFilterStatus(stockFilterStatus === 'amber' ? 'all' : 'amber')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-bold ${
                stockFilterStatus === 'amber'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Em breve ({buySoonList.length})</span>
            </button>

            <button
              onClick={() => setStockFilterStatus(stockFilterStatus === 'emerald' ? 'all' : 'emerald')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-bold ${
                stockFilterStatus === 'emerald'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Suficiente ({dontBuyList.length})</span>
            </button>
          </div>
        </div>

        {/* Barra de busca rápida para a mãe encontrar produto em 2 segundos */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
            placeholder="Buscar produto... (ex: Arroz, Feijão, Leite, Café)"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none placeholder:text-slate-400"
          />
          {stockSearch && (
            <button
              onClick={() => setStockSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Grade de Itens Simples com Bolinha Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredStock.map(({ product, metrics }) => {
            const cat = categories.find(c => c.id === product.category_id);
            const emoji = getProductEmoji(product.name, cat?.name);
            const statusColor = metrics.recommendation.color;

            const badgeBg = statusColor === 'red'
              ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/90 text-rose-900'
              : statusColor === 'amber'
              ? 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/90 text-amber-900'
              : 'bg-white/85 border-white/60 hover:bg-white text-slate-800';

            const dotBg = statusColor === 'red'
              ? 'bg-rose-500 shadow-rose-200'
              : statusColor === 'amber'
              ? 'bg-amber-400 shadow-amber-200'
              : 'bg-emerald-500 shadow-emerald-200';

            return (
              <div
                key={product.id}
                onClick={() => onOpenQuickAction('consumption', product.id)}
                className={`p-3 rounded-2xl border ${badgeBg} shadow-2xs transition-all flex items-center justify-between gap-2.5 cursor-pointer active:scale-97 group`}
                title="Clique para dar baixa rápida"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {product.current_stock} {product.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-3 h-3 rounded-full ${dotBg} shadow-xs shrink-0`} />
                  <span className="text-[11px] font-black">
                    {statusColor === 'red' ? '🔴' : statusColor === 'amber' ? '🟡' : '🟢'}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredStock.length === 0 && (
            <div className="col-span-full py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                Nenhum produto encontrado com esse filtro.
              </p>
              <button
                onClick={() => { setStockSearch(''); setStockFilterStatus('all'); }}
                className="mt-2 text-xs font-bold text-rose-600 hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Banner Receitas da Casa (Determinístico - Baseado no que tem na despensa) */}
      {recipes.length > 0 && (
        <div 
          onClick={() => onNavigateTab('recipes')}
          className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-orange-500/15 backdrop-blur-md border border-amber-300/40 p-5 sm:p-6 rounded-[2rem] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  O que podemos preparar para comer hoje?
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Despensa Ativa
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {readyRecipesCount > 0 ? (
                  <span className="font-semibold text-emerald-700">
                    ✨ Você tem {readyRecipesCount} {readyRecipesCount === 1 ? 'receita pronta' : 'receitas prontas'} para fazer agora com os itens da despensa!
                  </span>
                ) : missingOneRecipeCount > 0 ? (
                  <span>
                    💡 {missingOneRecipeCount} {missingOneRecipeCount === 1 ? 'receita precisa' : 'receitas precisam'} de apenas 1 ingrediente adicional.
                  </span>
                ) : (
                  <span>
                    Veja o que a casa pode preparar e economize evitando compras desnecessárias.
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-slate-800 group-hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <ChefHat className="w-4 h-4" />
            <span>Ver Receitas ➔</span>
          </button>
        </div>
      )}

      {/* 5. Seção: O que realmente precisamos comprar? (Lista Rápida) */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white/50 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              O que realmente precisamos comprar?
            </h2>
            <p className="text-xs text-slate-500">
              Calculado pelo motor de consumo familiar (sem desperdício).
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('shopping_list')}
            className="text-rose-600 text-xs sm:text-sm font-bold hover:text-rose-800 transition flex items-center gap-1"
          >
            <span>Ver lista completa ({buyNowList.length + buySoonList.length})</span>
            <span>→</span>
          </button>
        </div>

        {buyNowList.length === 0 && buySoonList.length === 0 ? (
          <div className="p-6 text-center bg-white/80 rounded-2xl border border-white/60 space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">A despensa está abastecida!</h3>
            <p className="text-xs text-slate-500">
              Nenhum gasto necessário hoje com base no ritmo de consumo familiar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {buyNowList.slice(0, 4).map(({ product, metrics }) => {
              const cat = categories.find(c => c.id === product.category_id);
              const emoji = getProductEmoji(product.name, cat?.name);
              return (
                <div 
                  key={product.id}
                  onClick={() => onNavigateTab('shopping_list')}
                  className="flex items-center justify-between p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl shadow-2xs hover:bg-rose-100/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{emoji}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{product.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Estoque: {product.current_stock} {product.unit} (Acabando)
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-rose-700 block">
                      +{formatQuantityWithUnit(metrics.recommendation.suggestedQuantity, product.unit)}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase">
                      Comprar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

