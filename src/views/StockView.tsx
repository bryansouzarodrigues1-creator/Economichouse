import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  SlidersHorizontal, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { Product, Category, Consumption } from '../types';
import { calculateProductMetrics, formatQuantityWithUnit } from '../utils/mathEngine';

interface StockViewProps {
  products: Product[];
  categories: Category[];
  consumptions: Consumption[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  categories,
  consumptions,
  onOpenNewProduct,
  onEditProduct,
  onOpenQuickAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-6 max-w-full overflow-x-hidden">
      {/* Header & Search */}
      <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 sm:p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight break-words hyphens-auto">
            📦 Despensa & Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 break-words hyphens-auto">
            Gestão e controle de estoque de produtos, taxas de consumo e previsão inteligente de reposição.
          </p>
        </div>

        <button
          onClick={onOpenNewProduct}
          id="btn-add-product-stock"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-slate-900/15 active:scale-95 transition min-h-[46px] touch-manipulation shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="break-words hyphens-auto">+ Adicionar ao Estoque</span>
        </button>
      </div>

      {/* Busca & Filtros por Categoria */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por arroz, feijão, sabonete, ração..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 outline-none shadow-xs transition"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white border border-white/40 shadow-2xs'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter(p => p.category_id === c.id).length;
            const isSelected = selectedCategoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-100'
                    : 'bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white border border-white/40 shadow-2xs'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#f43f5e' }} />
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white/75 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-sm space-y-4 max-w-full">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100/80 mx-auto flex items-center justify-center text-3xl shadow-inner">
            📦
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800 break-words hyphens-auto">
              {products.length === 0
                ? 'Sua despensa não possui itens cadastrados'
                : 'Nenhum item localizado no estoque'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed break-words hyphens-auto">
              {products.length === 0
                ? 'Sua despensa não possui itens cadastrados. Clique abaixo para iniciar o inventário e registrar os primeiros produtos da residência.'
                : searchQuery
                ? `Não encontramos nenhum item com "${searchQuery}". Tente buscar por outro termo ou limpe a pesquisa.`
                : 'Nenhum produto cadastrado nesta categoria ainda.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenNewProduct}
              className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-slate-900/15 active:scale-95 transition inline-flex items-center gap-2 min-h-[46px] touch-manipulation"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="break-words hyphens-auto">Iniciar Inventário</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((prod) => {
            const metrics = calculateProductMetrics(prod, consumptions);
            const category = categories.find(c => c.id === prod.category_id);
            const isCritical = prod.current_stock <= 0;
            const isLow = metrics.recommendation.status === 'buy_now';

            return (
              <div 
                key={prod.id}
                className="bg-white/75 backdrop-blur-md border border-white/50 rounded-[2rem] p-5 shadow-xs hover:bg-white/90 transition flex flex-col justify-between space-y-4 max-w-full overflow-hidden"
              >
                {/* Top Info */}
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white mb-2 shadow-xs break-words hyphens-auto"
                        style={{ backgroundColor: category?.color || '#4f46e5' }}
                      >
                        {category?.name || 'Geral'}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight break-words hyphens-auto leading-snug">
                        {prod.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => onEditProduct(prod)}
                      className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
                      title="Editar informações do produto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {prod.notes && (
                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-2 break-words hyphens-auto">
                      "{prod.notes}"
                    </p>
                  )}
                </div>

                {/* Estoque e Indicador de Duração */}
                <div className="flex items-end justify-between p-3.5 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/50">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estoque Atual
                    </span>
                    <span className={`text-2xl font-black break-words hyphens-auto ${
                      isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                    }`}>
                      {prod.current_stock} <span className="text-sm font-semibold text-slate-500">{prod.unit}</span>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Previsão
                    </span>
                    {metrics.daysOfStockEstimated !== null && metrics.daysOfStockEstimated < 900 ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ~{metrics.daysOfStockEstimated} {metrics.daysOfStockEstimated === 1 ? 'dia' : 'dias'}
                      </span>
                    ) : metrics.hasSufficientHistory ? (
                      <span className="text-xs font-bold text-emerald-600">Estoque Seguro</span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        Em formação
                      </span>
                    )}
                  </div>
                </div>

                {/* Mensagem de Estado de Consumo */}
                <p className="text-[11px] text-slate-500 leading-tight break-words hyphens-auto">
                  {metrics.recommendation.explanation}
                </p>

                {/* Botões Rápidos de 1 Toque */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/40">
                  <button
                    onClick={() => onOpenQuickAction('consumption', prod.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-rose-50/90 hover:bg-rose-100 text-rose-700 border border-rose-100/80 text-xs font-bold active:scale-95 transition min-h-[46px] touch-manipulation"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    <span className="break-words hyphens-auto">Item Consumido</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickAction('purchase', prod.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/80 text-xs font-bold active:scale-95 transition min-h-[46px] touch-manipulation"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span className="break-words hyphens-auto">Confirmar Compra</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickAction('stock_adjustment', prod.id)}
                    className="p-3 rounded-2xl bg-white/80 hover:bg-white text-slate-700 border border-white/60 transition min-h-[46px] min-w-[46px] flex items-center justify-center shrink-0 touch-manipulation"
                    title="Ajuste de Estoque"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
