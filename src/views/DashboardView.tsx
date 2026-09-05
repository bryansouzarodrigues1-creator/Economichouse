import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { Product, Consumption, Purchase, Category, UserMember } from '../types';
import { calculateProductMetrics, calculateMonthlyComparison, formatCurrency, formatQuantityWithUnit } from '../utils/mathEngine';

interface DashboardViewProps {
  products: Product[];
  consumptions: Consumption[];
  purchases: Purchase[];
  categories: Category[];
  members: UserMember[];
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
  activeMember,
  onNavigateTab,
  onOpenQuickAction,
  onOpenNewProduct,
}) => {
  // Cálculos determinísticos para cada produto
  const productMetrics = products.map(p => ({
    product: p,
    metrics: calculateProductMetrics(p, consumptions),
  }));

  const buyNowList = productMetrics.filter(pm => pm.metrics.recommendation.status === 'buy_now');
  const buySoonList = productMetrics.filter(pm => pm.metrics.recommendation.status === 'buy_soon');
  const dontBuyList = productMetrics.filter(pm => pm.metrics.recommendation.status === 'dont_buy');

  // Comparação de gastos do mês atual vs anterior
  const monthlyComp = calculateMonthlyComparison(purchases);

  // Consumos deste mês
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const monthConsumptions = consumptions.filter(c => c.date.startsWith(currentYearMonth));
  const monthConsumptionTotalItems = monthConsumptions.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);

  // Gastos por categoria
  const categorySpendingMap = new Map<string, number>();
  purchases.forEach(pur => {
    if (pur.date.startsWith(currentYearMonth) && pur.items) {
      pur.items.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        const catId = prod?.category_id || 'other';
        const current = categorySpendingMap.get(catId) || 0;
        categorySpendingMap.set(catId, current + (item.total_price || 0));
      });
    }
  });

  const topCategories = Array.from(categorySpendingMap.entries())
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || 'Diversos',
        color: cat?.color || '#059669',
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  // Data formatada amigável em português
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Saudação Familiar Acolhedora em Frosted Glass */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {todayFormatted}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight mt-1">
              Olá, {activeMember?.name?.split(' ')[0] || 'Mãe'}!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              Bem-vinda ao CasaControle. Saiba exatamente o que temos em casa e o que realmente precisamos comprar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onOpenQuickAction('consumption')}
              id="dash-btn-consumption"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-emerald-100 transition flex items-center gap-2"
            >
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Consumo</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('purchase')}
              id="dash-btn-purchase"
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-rose-100 transition flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Compra</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Os 4 Indicadores Frosted Glass (Do Design HTML) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: 🔴 Comprar Agora */}
        <div 
          onClick={() => onNavigateTab('shopping_list')}
          className="bg-white/70 backdrop-blur-md border border-white/40 p-5 rounded-[2rem] shadow-sm hover:bg-white/80 transition cursor-pointer"
        >
          <p className="text-rose-600 text-xs font-bold uppercase tracking-widest mb-1">🔴 Comprar Agora</p>
          <p className="text-3xl font-bold text-slate-800">{String(buyNowList.length).padStart(2, '0')}</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Itens em falta crítica</p>
        </div>

        {/* Card 2: 🟡 Comprar em breve */}
        <div 
          onClick={() => onNavigateTab('shopping_list')}
          className="bg-white/70 backdrop-blur-md border border-white/40 p-5 rounded-[2rem] shadow-sm hover:bg-white/80 transition cursor-pointer"
        >
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">🟡 Comprar em breve</p>
          <p className="text-3xl font-bold text-slate-800">{String(buySoonList.length).padStart(2, '0')}</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Abaixo do consumo médio</p>
        </div>

        {/* Card 3: 🟢 Estoque OK */}
        <div 
          onClick={() => onNavigateTab('stock')}
          className="bg-white/70 backdrop-blur-md border border-white/40 p-5 rounded-[2rem] shadow-sm hover:bg-white/80 transition cursor-pointer"
        >
          <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">🟢 Estoque OK</p>
          <p className="text-3xl font-bold text-slate-800">{String(dontBuyList.length).padStart(2, '0')}</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Produtos suficientes</p>
        </div>

        {/* Card 4: 📉 Economia / Gastos */}
        <div 
          onClick={() => onNavigateTab('purchases')}
          className="bg-white/70 backdrop-blur-md border border-white/40 p-5 rounded-[2rem] shadow-sm hover:bg-white/80 transition cursor-pointer"
        >
          <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-1">
            📉 {monthlyComp.previousMonthExpenses > 0 && monthlyComp.expensesDiffPercentage <= 0 ? 'Economia' : 'Gastos do Mês'}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
            {monthlyComp.previousMonthExpenses > 0 && monthlyComp.expensesDiffPercentage <= 0 
              ? `${Math.abs(monthlyComp.expensesDiffPercentage).toFixed(0)}%` 
              : formatCurrency(monthlyComp.monthExpenses)}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 truncate">
            {monthlyComp.previousMonthExpenses > 0 
              ? `${monthlyComp.expensesDiffPercentage <= 0 ? 'Menos gastos que mês anterior' : 'Gastos no mês atual'}` 
              : `${products.length} itens controlados`}
          </p>
        </div>
      </div>

      {/* 3. Seção Central Dividida (7 Colunas vs 5 Colunas - Exatamente como no Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1: O que realmente precisamos comprar? (7 colunas) */}
        <section className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold text-slate-800">O que realmente precisamos comprar?</h2>
            <button
              onClick={() => onNavigateTab('shopping_list')}
              className="text-rose-600 text-xs sm:text-sm font-semibold hover:text-rose-800 transition flex items-center gap-1"
            >
              <span>Ver lista completa</span>
              <span>→</span>
            </button>
          </div>

          <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-3 sm:p-4 shadow-inner space-y-2.5">
            {buyNowList.length === 0 && buySoonList.length === 0 ? (
              <div className="p-8 text-center bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">A despensa está abastecida!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Todos os produtos estão com estoque seguro frente ao consumo da família. Nenhum gasto necessário agora!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Itens Urgentes 🔴 Comprar */}
                {buyNowList.slice(0, 4).map(({ product, metrics }) => {
                  const cat = categories.find(c => c.id === product.category_id);
                  const emoji = getProductEmoji(product.name, cat?.name);
                  return (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3.5 sm:p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 hover:bg-white/95 transition"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-red-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{product.name}</p>
                          <p className="text-xs text-slate-500 italic truncate">
                            {metrics.avgMonthlyConsumption > 0 
                              ? `Consumo: ~${metrics.avgMonthlyConsumption.toFixed(1)} ${product.unit}/mês • Estoque: ${product.current_stock} ${product.unit}`
                              : `Estoque: ${product.current_stock} ${product.unit}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <p className="text-red-600 font-black text-sm sm:text-lg">
                          Comprar {formatQuantityWithUnit(metrics.recommendation.suggestedQuantity, product.unit)}
                        </p>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">
                          {product.current_stock <= 0 ? 'Acabou' : 'Falta Crítica'}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Itens de Atenção 🟡 Comprar em breve */}
                {buySoonList.slice(0, 2).map(({ product, metrics }) => {
                  const cat = categories.find(c => c.id === product.category_id);
                  const emoji = getProductEmoji(product.name, cat?.name);
                  return (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 hover:bg-white/95 transition"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{product.name}</p>
                          <p className="text-xs text-slate-500 italic truncate">
                            Estoque: {product.current_stock} {product.unit} • Resta ~{metrics.daysOfStockEstimated} dias
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <p className="text-amber-600 font-black text-sm sm:text-base">
                          Comprar {formatQuantityWithUnit(metrics.recommendation.suggestedQuantity, product.unit)}
                        </p>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">
                          Comprar em breve
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Coluna 2: Ações Rápidas & Categorias (5 colunas) */}
        <section className="lg:col-span-5 flex flex-col space-y-3">
          <h2 className="text-xl font-bold text-slate-800">Ações Rápidas</h2>

          {/* Os 2 Grandes Botões de Ação do Design */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onOpenQuickAction('purchase')}
              className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2.5rem] p-5 sm:p-6 text-white flex flex-col justify-between items-start shadow-xl shadow-rose-200/80 hover:scale-[1.02] active:scale-95 transition-transform text-left cursor-pointer min-h-[140px]"
            >
              <span className="text-3xl">🛒</span>
              <span className="text-base sm:text-lg font-bold leading-tight mt-3">
                Registrar<br />Compra
              </span>
            </button>

            <button 
              onClick={() => onOpenQuickAction('consumption')}
              className="bg-emerald-600 rounded-[2.5rem] p-5 sm:p-6 text-white flex flex-col justify-between items-start shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-transform text-left cursor-pointer min-h-[140px]"
            >
              <span className="text-3xl">🍽️</span>
              <span className="text-base sm:text-lg font-bold leading-tight mt-3">
                Registrar<br />Consumo
              </span>
            </button>
          </div>

          {/* Painel de Categorias mais usadas & Dica da Casa */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white/40 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 mb-3">Categorias mais usadas</h3>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 5).map(cat => (
                  <span 
                    key={cat.id}
                    onClick={() => onNavigateTab('stock')}
                    className="px-4 py-2 bg-white/80 backdrop-blur-xs rounded-full text-xs font-semibold text-slate-600 shadow-sm border border-white/60 cursor-pointer hover:bg-white transition"
                  >
                    {cat.name}
                  </span>
                ))}
                <button
                  onClick={onOpenNewProduct}
                  className="px-4 py-2 bg-rose-100/90 text-rose-700 border border-rose-200/60 rounded-full text-xs font-bold shadow-sm hover:bg-rose-200 transition"
                >
                  + Novo Item
                </button>
              </div>
            </div>

            {/* Dica do CasaControle */}
            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-100 space-y-1">
              <p className="text-xs text-rose-800 font-bold uppercase tracking-wider mb-1">
                Dica do CasaControle
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Se você tem 6 kg de arroz e a casa consome 7 kg no mês, o sistema não recomendará comprar outro pacote agora. Proteja seu dinheiro contra desperdícios!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

