import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  ShoppingBag,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Product, Consumption, Category } from '../types';
import { calculateProductMetrics, formatQuantityWithUnit } from '../utils/mathEngine';

interface ShoppingListViewProps {
  products: Product[];
  consumptions: Consumption[];
  categories: Category[];
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  products,
  consumptions,
  categories,
  onOpenQuickAction,
}) => {
  const [filter, setFilter] = useState<'all' | 'buy_now' | 'buy_soon' | 'dont_buy'>('all');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const items = products.map(product => ({
    product,
    metrics: calculateProductMetrics(product, consumptions),
    category: categories.find(c => c.id === product.category_id),
  }));

  const buyNowItems = items.filter(i => i.metrics.recommendation.status === 'buy_now');
  const buySoonItems = items.filter(i => i.metrics.recommendation.status === 'buy_soon');
  const dontBuyItems = items.filter(i => i.metrics.recommendation.status === 'dont_buy');

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(i => i.metrics.recommendation.status === filter);

  const toggleCheck = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title & Explanation */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              O que realmente precisamos comprar?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Evite compras por impulso. O sistema compara seu estoque atual com a média real de consumo da família.
            </p>
          </div>
        </div>

        {/* Status Pills / Counter */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/50">
          <button
            onClick={() => setFilter('buy_now')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'buy_now'
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white/50 backdrop-blur-xs border-white/50 hover:bg-rose-50/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span className="text-xs font-bold text-rose-900">Comprar</span>
            </div>
            <span className="text-xl font-black text-rose-700 mt-1 block">{buyNowItems.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Urgente / Sem estoque</span>
          </button>

          <button
            onClick={() => setFilter('buy_soon')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'buy_soon'
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-200'
                : 'bg-white/50 backdrop-blur-xs border-white/50 hover:bg-amber-50/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-900">Em breve</span>
            </div>
            <span className="text-xl font-black text-amber-700 mt-1 block">{buySoonItems.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Dura 7 a 15 dias</span>
          </button>

          <button
            onClick={() => setFilter('dont_buy')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'dont_buy'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white/50 backdrop-blur-xs border-white/50 hover:bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Não comprar</span>
            </div>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{dontBuyItems.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Estoque suficiente</span>
          </button>
        </div>

        {filter !== 'all' && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
            >
              Mostrar todos os itens ({items.length})
            </button>
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3.5">
        {filteredItems.map(({ product, metrics, category }) => {
          const rec = metrics.recommendation;
          const isChecked = checkedItems.has(product.id);

          return (
            <div
              key={product.id}
              className={`bg-white/70 backdrop-blur-md border border-white/40 rounded-[2rem] p-4 sm:p-5 shadow-sm transition ${
                isChecked ? 'opacity-50 bg-white/40' : 'hover:bg-white/85'
              }`}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                {/* Checkbox para a mãe marcar no supermercado */}
                <button
                  onClick={() => toggleCheck(product.id)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                    isChecked 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'border-slate-300 bg-white/90 hover:border-emerald-600'
                  }`}
                  title="Marcar como colocado no carrinho"
                >
                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: category?.color || '#4f46e5' }}
                    >
                      {category?.name || 'Geral'}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      rec.status === 'buy_now' 
                        ? 'bg-rose-100/90 text-rose-800' 
                        : rec.status === 'buy_soon'
                        ? 'bg-amber-100/90 text-amber-800'
                        : 'bg-emerald-100/90 text-emerald-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rec.status === 'buy_now' ? 'bg-rose-600' : rec.status === 'buy_soon' ? 'bg-amber-500' : 'bg-emerald-600'
                      }`} />
                      {rec.statusLabel}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold text-slate-800 tracking-tight ${isChecked ? 'line-through text-slate-400' : ''}`}>
                    {product.name}
                  </h3>

                  {/* Comparativo de Estoque vs Consumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2 text-xs bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/50">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Estoque em Casa:</span>
                      <strong className="text-slate-800 font-bold">{product.current_stock} {product.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Consumo Mensal:</span>
                      <strong className="text-slate-800 font-bold">
                        {metrics.avgMonthlyConsumption > 0 ? `~${metrics.avgMonthlyConsumption.toFixed(1)} ${product.unit}` : 'Em formação'}
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Duração Estimada:</span>
                      <strong className={`${metrics.daysOfStockEstimated && metrics.daysOfStockEstimated <= 7 ? 'text-rose-600' : 'text-emerald-600'} font-bold`}>
                        {metrics.daysOfStockEstimated !== null && metrics.daysOfStockEstimated < 900
                          ? `~${metrics.daysOfStockEstimated} dias`
                          : 'Suficiente'}
                      </strong>
                    </div>
                  </div>

                  {/* Explicação Matemática Transparente */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>

                {/* Sugestão de Compra e Botão de Ação */}
                <div className="text-right shrink-0 flex flex-col items-end justify-between">
                  {rec.suggestedQuantity > 0 ? (
                    <div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                        Comprar Aprox.
                      </span>
                      <span className="text-lg sm:text-xl font-black text-rose-700">
                        {formatQuantityWithUnit(rec.suggestedQuantity, product.unit)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                        Recomendação
                      </span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        Não Comprar
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onOpenQuickAction('purchase', product.id)}
                    className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold hover:bg-slate-900 active:scale-95 shadow-md shadow-slate-900/10 transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Registrar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
