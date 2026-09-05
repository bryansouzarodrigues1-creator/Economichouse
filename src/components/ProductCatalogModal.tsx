import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  ShoppingCart, 
  Package, 
  Check, 
  Sparkles,
  Filter
} from 'lucide-react';
import { NATIVE_CATALOG, CatalogItem, getCatalogCategories, searchCatalog } from '../data/nativeCatalog';
import { Product } from '../types';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialSearchQuery?: string;
  onAddToShoppingList: (item: CatalogItem, quantity?: number) => void;
  onAddToPantry: (item: CatalogItem, quantity?: number) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  initialSearchQuery = '',
  onAddToShoppingList,
  onAddToPantry,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedToListIds, setAddedToListIds] = useState<Set<string>>(new Set());
  const [addedToPantryIds, setAddedToPantryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(initialSearchQuery);
    }
  }, [isOpen, initialSearchQuery]);

  const categories = useMemo(() => getCatalogCategories(), []);

  const items = useMemo(() => {
    return searchCatalog(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleAddToList = (item: CatalogItem) => {
    onAddToShoppingList(item, item.defaultMinStock || 1);
    setAddedToListIds(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedToListIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  const handleAddToPantry = (item: CatalogItem) => {
    onAddToPantry(item, item.defaultMinStock || 1);
    setAddedToPantryIds(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedToPantryIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-2xl w-full max-w-3xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header com Azul Corporativo & Esmeralda */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-inner">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Biblioteca Global de Produtos
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {NATIVE_CATALOG.length} Itens Nativos
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Itens essenciais do dia a dia prontos para adicionar com 1 clique.
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

        {/* Barra de Busca e Filtros de Categoria */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no catálogo (ex: Detergente, Arroz, Ovos, Papel Higiênico)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos ({NATIVE_CATALOG.length})
            </button>
            {categories.map((cat) => {
              const catItem = NATIVE_CATALOG.find(i => i.category === cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{catItem?.categoryIcon}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {items.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="text-3xl">🔍</span>
              <h3 className="text-sm font-bold text-slate-800">Nenhum item encontrado no catálogo</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não encontrou o que procurava? Você pode cadastrar um produto personalizado na tela da Despensa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => {
                const existingPantryProduct = products.find(
                  p => p.name.toLowerCase() === item.name.toLowerCase() || 
                       p.name.toLowerCase().includes(item.name.toLowerCase())
                );
                const isAddedToList = addedToListIds.has(item.id);
                const isAddedToPantry = addedToPantryIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                          {existingPantryProduct && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Na Despensa: {existingPantryProduct.current_stock} {existingPantryProduct.unit}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 leading-snug break-words">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Padrão: {item.typicalPackage} • Unidade: {item.defaultUnit}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleAddToList(item)}
                        className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          isAddedToList
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                        title="Enviar diretamente para a Lista de Compras"
                      >
                        {isAddedToList ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Na Lista!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>➕ Adicionar se Faltar</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToPantry(item)}
                        className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          isAddedToPantry
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                        title="Adicionar ou ajustar quantidade na Despensa"
                      >
                        {isAddedToPantry ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>No Estoque!</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3.5 h-3.5" />
                            <span>📦 Despensa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
