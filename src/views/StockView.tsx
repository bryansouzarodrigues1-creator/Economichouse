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
    <div className="space-y-5 pb-6">
      {/* Header & Search */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Estoque da Casa</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de itens disponíveis, unidades e previsão de duração.
          </p>
        </div>

        <button
          onClick={onOpenNewProduct}
          id="btn-add-product-stock"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-rose-100 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Produto</span>
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
        <div className="p-12 text-center bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-sm space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? 'Tente buscar com outras palavras ou limpe o campo de busca.' 
              : 'Cadastre o primeiro item para começar o controle da despensa.'}
          </p>
          <button
            onClick={onOpenNewProduct}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-100"
          >
            Cadastrar Produto
          </button>
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
                className="bg-white/70 backdrop-blur-md border border-white/40 rounded-[2rem] p-5 shadow-sm hover:bg-white/85 transition flex flex-col justify-between space-y-4"
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white mb-2 shadow-xs"
                        style={{ backgroundColor: category?.color || '#4f46e5' }}
                      >
                        {category?.name || 'Geral'}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">
                        {prod.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => onEditProduct(prod)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition"
                      title="Editar informações do produto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {prod.notes && (
                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                      "{prod.notes}"
                    </p>
                  )}
                </div>

                {/* Estoque e Indicador de Duração */}
                <div className="flex items-end justify-between p-3.5 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estoque Atual
                    </span>
                    <span className={`text-2xl font-black ${
                      isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                    }`}>
                      {prod.current_stock} <span className="text-sm font-semibold text-slate-500">{prod.unit}</span>
                    </span>
                  </div>

                  <div className="text-right">
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
                <p className="text-[11px] text-slate-500 leading-tight">
                  {metrics.recommendation.explanation}
                </p>

                {/* Botões Rápidos de 1 Toque */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/40">
                  <button
                    onClick={() => onOpenQuickAction('consumption', prod.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-100/60 text-xs font-bold active:scale-95 transition"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Consumir</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickAction('purchase', prod.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/60 text-xs font-bold active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Comprar</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickAction('stock_adjustment', prod.id)}
                    className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-white/60 transition"
                    title="Ajustar contagem física"
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
