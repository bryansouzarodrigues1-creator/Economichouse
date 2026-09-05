import React, { useState } from 'react';
import { 
  Receipt, 
  Store, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Purchase, Product, Category, UserMember, PriceHistory } from '../types';
import { formatCurrency } from '../utils/mathEngine';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  categories: Category[];
  members: UserMember[];
  priceHistory: PriceHistory[];
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  products,
  categories,
  members,
  priceHistory,
  onOpenQuickAction,
}) => {
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  const [priceHistoryProductId, setPriceHistoryProductId] = useState<string>('all');

  const totalSpentAllTime = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);

  // Ordenadas da mais recente para a mais antiga
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filtragem de histórico de preços
  const filteredPriceHistory = priceHistoryProductId === 'all'
    ? priceHistory
    : priceHistory.filter(h => h.product_id === priceHistoryProductId);

  const sortedPriceHistory = [...filteredPriceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compras e Gastos</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Histórico das compras do supermercado, preços pagos e controle financeiro familiar.
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAction('purchase')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-rose-100 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Compra</span>
        </button>
      </div>

      {/* Cartão de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-5 rounded-[2rem] bg-white/70 backdrop-blur-md border border-white/40 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Compras</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{purchases.length}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Registros na base</span>
        </div>

        <div className="p-5 rounded-[2rem] bg-white/70 backdrop-blur-md border border-white/40 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Investido</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {formatCurrency(totalSpentAllTime)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Alimentação e suprimentos</span>
        </div>

        <div className="p-5 rounded-[2rem] bg-white/70 backdrop-blur-md border border-white/40 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ticket Médio</span>
          <span className="text-2xl font-black text-teal-700 mt-1 block">
            {formatCurrency(purchases.length > 0 ? totalSpentAllTime / purchases.length : 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Média por ida ao mercado</span>
        </div>
      </div>

      {/* Seção 1: Monitor de Evolução de Preços */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Evolução de Preços por Produto
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Descubra onde o produto estava mais barato e compare preços entre datas e estabelecimentos.
            </p>
          </div>

          <select
            value={priceHistoryProductId}
            onChange={(e) => setPriceHistoryProductId(e.target.value)}
            className="text-xs font-bold bg-white/80 border border-white/50 rounded-xl px-3 py-2 outline-none shadow-2xs focus:border-rose-400"
          >
            <option value="all">Ver todos os produtos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {sortedPriceHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Nenhum histórico de preço registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Preço Unitário</th>
                  <th className="py-2.5 px-3">Mercado / Estabelecimento</th>
                  <th className="py-2.5 px-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {sortedPriceHistory.slice(0, 8).map(h => {
                  const prod = products.find(p => p.id === h.product_id);
                  return (
                    <tr key={h.id} className="hover:bg-white/60 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {prod?.name || 'Produto'}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-600">
                        {formatCurrency(h.unit_price)} / {prod?.unit || 'un'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {h.store_name || 'Mercado Geral'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {h.date.split('-').reverse().join('/')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção 2: Lista de Compras Realizadas */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-white/40 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Histórico de Compras da Casa
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {purchases.length} {purchases.length === 1 ? 'compra' : 'compras'}
          </span>
        </div>

        {sortedPurchases.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Nenhuma compra cadastrada ainda</p>
            <p className="text-xs text-slate-400">Clique em "Registrar Compra" para lançar sua primeira ida ao mercado.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/30">
            {sortedPurchases.map((purchase) => {
              const buyer = members.find(m => m.id === purchase.buyer_member_id);
              const isExpanded = expandedPurchaseId === purchase.id;

              return (
                <div key={purchase.id} className="p-4 sm:p-5 transition hover:bg-white/50">
                  <div 
                    onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {purchase.store_name || 'Supermercado'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {purchase.date.split('-').reverse().join('/')}
                          </span>
                          {buyer && (
                            <span>• Comprado por: <strong>{buyer.name}</strong></span>
                          )}
                          <span>• {purchase.items?.length || 0} itens</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 block">
                          {formatCurrency(purchase.total_amount)}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold block">
                          {isExpanded ? 'Ocultar itens' : 'Ver itens'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Itens da Compra Expandidos */}
                  {isExpanded && purchase.items && (
                    <div className="mt-4 pt-3 border-t border-white/40 bg-white/60 backdrop-blur-xs p-4 rounded-2xl space-y-2 animate-in fade-in duration-150">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Itens desta compra:
                      </span>
                      <div className="space-y-1.5">
                        {purchase.items.map((it) => {
                          const prod = products.find(p => p.id === it.product_id);
                          return (
                            <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/40 last:border-none">
                              <span className="font-semibold text-slate-800">
                                {prod?.name || 'Produto'} ({it.quantity} {prod?.unit || 'un'})
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(it.total_price)}
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({formatCurrency(it.unit_price)}/un)
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {purchase.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2">
                          Obs: "{purchase.notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
