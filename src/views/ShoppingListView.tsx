import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ShoppingBag,
  Plus,
  Trash2,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  TrendingDown,
  Store
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Consumption, Category } from '../types';
import { calculateProductMetrics, formatQuantityWithUnit } from '../utils/mathEngine';
import { 
  ManualShoppingItem, 
  getStoredShoppingItems, 
  removeShoppingItem, 
  clearAllShoppingItems,
  addShoppingItem 
} from '../utils/shoppingListStore';

interface ShoppingListViewProps {
  products: Product[];
  consumptions: Consumption[];
  categories: Category[];
  houseId: string;
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
  onConfirmPurchaseDirect: (payload: { name: string; quantity: number; unit: string; productId?: string; price?: number }) => Promise<void>;
  onOpenCatalog: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  products,
  consumptions,
  categories,
  houseId,
  onOpenQuickAction,
  onConfirmPurchaseDirect,
  onOpenCatalog,
}) => {
  const [filter, setFilter] = useState<'all' | 'buy_now' | 'buy_soon' | 'manual'>('all');
  const [persistentItems, setPersistentItems] = useState<ManualShoppingItem[]>([]);
  const [recentlyBought, setRecentlyBought] = useState<string | null>(null);
  const [manualInputName, setManualInputName] = useState('');
  const [manualInputQty, setManualInputQty] = useState('1');
  const [manualInputUnit, setManualInputUnit] = useState('unidade');

  // Carrega itens manuais fixos persistentes
  useEffect(() => {
    setPersistentItems(getStoredShoppingItems(houseId));
  }, [houseId]);

  const reloadPersistentItems = () => {
    setPersistentItems(getStoredShoppingItems(houseId));
  };

  // Itens sugeridos pelo cálculo estatístico da despensa
  const pantryItems = products.map(product => ({
    product,
    metrics: calculateProductMetrics(product, consumptions),
    category: categories.find(c => c.id === product.category_id),
  }));

  // Itens urgentes e em breve da despensa
  const buyNowPantry = pantryItems.filter(i => i.metrics.recommendation.status === 'buy_now');
  const buySoonPantry = pantryItems.filter(i => i.metrics.recommendation.status === 'buy_soon');

  // Executa celebração interativa com confetes e move da lista para o estoque da despensa
  const handleComprei = async (item: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    productId?: string;
    isPersistent?: boolean;
  }) => {
    // 1. Confetes interativos
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#10b981', '#0284c7', '#3b82f6', '#059669', '#f59e0b'],
      });
    } catch (e) {
      // Confetti fallback
    }

    // 2. Feedback visual
    setRecentlyBought(item.name);
    setTimeout(() => {
      setRecentlyBought(null);
    }, 4000);

    // 3. Incrementa estoque na despensa
    await onConfirmPurchaseDirect({
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit: item.unit,
      productId: item.productId,
    });

    // 4. Se for item fixo persistente, remove da lista
    if (item.isPersistent) {
      removeShoppingItem(houseId, item.id);
      reloadPersistentItems();
    }
  };

  const handleAddQuickManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputName.trim()) return;
    
    // Verifica se já existe produto na despensa para associar o ID
    const matched = products.find(p => p.name.toLowerCase() === manualInputName.trim().toLowerCase());

    addShoppingItem(houseId, {
      name: manualInputName.trim(),
      productId: matched?.id,
      quantity: Number(manualInputQty) || 1,
      unit: manualInputUnit || matched?.unit || 'unidade',
      source: 'manual',
      icon: '🛒',
    });

    setManualInputName('');
    setManualInputQty('1');
    reloadPersistentItems();
  };

  const handleRemovePersistent = (id: string) => {
    removeShoppingItem(houseId, id);
    reloadPersistentItems();
  };

  const totalItemsCount = persistentItems.length + buyNowPantry.length + buySoonPantry.length;

  return (
    <div className="space-y-5 pb-8 max-w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* 1. Header com Design System MarketBuy Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-900 to-emerald-800 text-white flex items-center justify-center shrink-0 text-2xl shadow-md shadow-blue-950/15">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Lista de Compras Inteligente
                </h1>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Itens'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Itens fixos e reposição calculada pelo consumo real. Clique em <strong>[COMPREI!]</strong> para transferir direto para a despensa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCatalog}
              className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition min-h-[46px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ Biblioteca de Produtos</span>
            </button>
          </div>
        </div>

        {/* Feedback visual de compra confirmada */}
        {recentlyBought && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Excelente! <strong>{recentlyBought}</strong> foi adicionado com sucesso ao estoque da sua despensa!</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Estoque Atualizado ✓</span>
          </div>
        )}

        {/* Formulário Rápido de Adição Manual */}
        <form onSubmit={handleAddQuickManual} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={manualInputName}
              onChange={(e) => setManualInputName(e.target.value)}
              placeholder="Adicionar item rápido à lista (ex: Papel Toalha, Sabonete, Frango)..."
              className="w-full pl-3.5 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min="0.1"
              step="any"
              value={manualInputQty}
              onChange={(e) => setManualInputQty(e.target.value)}
              className="w-20 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm text-center font-bold outline-none"
            />
            <select
              value={manualInputUnit}
              onChange={(e) => setManualInputUnit(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold outline-none"
            >
              <option value="unidade">unidade</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pacote">pacote</option>
              <option value="caixa">caixa</option>
              <option value="dúzia">dúzia</option>
            </select>
            <button
              type="submit"
              disabled={!manualInputName.trim()}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold text-xs shrink-0 transition active:scale-95 min-h-[42px]"
            >
              + Adicionar
            </button>
          </div>
        </form>
      </div>

      {/* 2. Filtros de Navegação Rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setFilter('all')}
          className={`p-3 rounded-2xl border text-left transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white/80 backdrop-blur-md border-white/60 hover:bg-white text-slate-700'
          }`}
        >
          <span className="text-xs font-bold block">Todos</span>
          <span className="text-lg font-black mt-0.5 block">{totalItemsCount}</span>
        </button>

        <button
          onClick={() => setFilter('buy_now')}
          className={`p-3 rounded-2xl border text-left transition ${
            filter === 'buy_now'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white/80 backdrop-blur-md border-white/60 hover:bg-white text-slate-700'
          }`}
        >
          <span className="text-xs font-bold block text-rose-600">Comprar Já</span>
          <span className="text-lg font-black mt-0.5 block text-rose-700">{buyNowPantry.length}</span>
        </button>

        <button
          onClick={() => setFilter('buy_soon')}
          className={`p-3 rounded-2xl border text-left transition ${
            filter === 'buy_soon'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white/80 backdrop-blur-md border-white/60 hover:bg-white text-slate-700'
          }`}
        >
          <span className="text-xs font-bold block text-amber-600">Em Breve</span>
          <span className="text-lg font-black mt-0.5 block text-amber-700">{buySoonPantry.length}</span>
        </button>

        <button
          onClick={() => setFilter('manual')}
          className={`p-3 rounded-2xl border text-left transition ${
            filter === 'manual'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white/80 backdrop-blur-md border-white/60 hover:bg-white text-slate-700'
          }`}
        >
          <span className="text-xs font-bold block text-emerald-600">Fixos / Adicionados</span>
          <span className="text-lg font-black mt-0.5 block text-emerald-700">{persistentItems.length}</span>
        </button>
      </div>

      {/* 3. Lista Principal com Botão [COMPREI!] */}
      {totalItemsCount === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 mx-auto flex items-center justify-center text-3xl shadow-inner">
            ✨
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800">Tudo em ordem no estoque!</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Nenhum item está em nível crítico no momento. Você pode navegar na biblioteca nativa e clicar em <strong>[➕ Adicionar se Faltar]</strong> para antecipar compras.
            </p>
          </div>
          <button
            onClick={onOpenCatalog}
            className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition"
          >
            Abrir Biblioteca de Produtos
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* SEÇÃO 1: ITENS FIXOS PERSISTENTES (CATÁLOGO OU MANUAIS) */}
          {(filter === 'all' || filter === 'manual') && persistentItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                  {item.icon || '🛍️'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Item Fixo da Lista
                    </span>
                    {item.source === 'catalog' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Via Catálogo
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quantidade planejada: <strong className="text-slate-800">{item.quantity} {item.unit}</strong>
                  </p>
                </div>
              </div>

              {/* Botão [COMPREI!] e Excluir */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => handleRemovePersistent(item.id)}
                  className="w-10 h-10 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                  title="Remover da lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleComprei({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    productId: item.productId,
                    isPersistent: true,
                  })}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition min-h-[44px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>COMPREI!</span>
                </button>
              </div>
            </div>
          ))}

          {/* SEÇÃO 2: ITENS CALCULADOS DA DESPENSA (URGENTES E EM BREVE) */}
          {(filter === 'all' || filter === 'buy_now' || filter === 'buy_soon') && (
            <>
              {[...buyNowPantry, ...buySoonPantry]
                .filter(i => {
                  if (filter === 'buy_now') return i.metrics.recommendation.status === 'buy_now';
                  if (filter === 'buy_soon') return i.metrics.recommendation.status === 'buy_soon';
                  return true;
                })
                .map(({ product, metrics, category }) => {
                  const rec = metrics.recommendation;
                  const isNow = rec.status === 'buy_now';

                  return (
                    <div
                      key={product.id}
                      className={`p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isNow ? 'border-rose-200/80' : 'border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          isNow ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {isNow ? '🔴' : '🟡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                              style={{ backgroundColor: category?.color || '#0284c7' }}
                            >
                              {category?.name || 'Geral'}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isNow ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.statusLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Estoque atual: <strong>{product.current_stock} {product.unit}</strong>
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {rec.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Botão [COMPREI!] */}
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Comprar</span>
                          <span className="text-sm font-black text-slate-800">
                            {formatQuantityWithUnit(rec.suggestedQuantity, product.unit)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleComprei({
                            id: product.id,
                            name: product.name,
                            quantity: rec.suggestedQuantity || 1,
                            unit: product.unit,
                            productId: product.id,
                            isPersistent: false,
                          })}
                          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition min-h-[44px]"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>COMPREI!</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
