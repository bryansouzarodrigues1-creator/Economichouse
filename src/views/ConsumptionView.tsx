import React, { useState } from 'react';
import { 
  TrendingDown, 
  Calendar, 
  User, 
  Info, 
  Plus, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Activity 
} from 'lucide-react';
import { Product, Consumption, UserMember, Category } from '../types';
import { calculateProductMetrics, formatQuantityWithUnit } from '../utils/mathEngine';

interface ConsumptionViewProps {
  products: Product[];
  consumptions: Consumption[];
  members: UserMember[];
  categories: Category[];
  onOpenQuickAction: (actionType: 'consumption' | 'purchase' | 'stock_adjustment', productId?: string) => void;
}

export const ConsumptionView: React.FC<ConsumptionViewProps> = ({
  products,
  consumptions,
  members,
  categories,
  onOpenQuickAction,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  // Ordena consumos do mais recente para o mais antigo
  const sortedConsumptions = [...consumptions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredConsumptions = selectedProductId === 'all'
    ? sortedConsumptions
    : sortedConsumptions.filter(c => c.product_id === selectedProductId);

  // Se um produto específico for selecionado, mostramos o cartão de análise matemática detalhada
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const metricsForSelected = selectedProduct 
    ? calculateProductMetrics(selectedProduct, consumptions) 
    : null;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Controle de Consumo</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acompanhe o que a família consome e veja as médias de reposição.
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAction('consumption')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-rose-100 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Consumo</span>
        </button>
      </div>

      {/* Seletor de Produto para Análise Específica */}
      <div className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-white/40 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Filtrar Análise por Produto:
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full text-sm font-semibold bg-white/80 border border-white/50 rounded-2xl p-3.5 focus:border-rose-400 outline-none shadow-2xs"
        >
          <option value="all">Todos os produtos ({consumptions.length} consumos registrados)</option>
          {products.map(p => {
            const count = consumptions.filter(c => c.product_id === p.id).length;
            return (
              <option key={p.id} value={p.id}>
                {p.name} ({count} registros)
              </option>
            );
          })}
        </select>
      </div>

      {/* Cartão de Médias Determinísticas quando um produto é selecionado */}
      {selectedProduct && metricsForSelected && (
        <div className="bg-slate-900/90 backdrop-blur-xl text-white p-6 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Padrão de Consumo Calculado
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">{selectedProduct.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Estoque Atual:</span>
              <span className="text-xl font-black text-rose-400">
                {selectedProduct.current_stock} {selectedProduct.unit}
              </span>
            </div>
          </div>

          {/* Se houver dados suficientes vs em formação */}
          {!metricsForSelected.hasSufficientHistory ? (
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-amber-500/40 flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">
                {metricsForSelected.historyStatusMessage} O sistema precisa de mais registros ao longo dos dias para fechar a média com exatidão matemática.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-rose-950/50 rounded-2xl border border-rose-500/30 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-200">
                Base calculada sobre {metricsForSelected.daysOfHistory} dias de dados históricos ({metricsForSelected.recordsCount} registros).
              </span>
            </div>
          )}

          {/* Grid de Métricas de Consumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Consumo Diário</span>
              <span className="text-base font-black text-white mt-1 block">
                {metricsForSelected.avgDailyConsumption > 0 
                  ? `${metricsForSelected.avgDailyConsumption.toFixed(2)} ${selectedProduct.unit}/dia`
                  : '—'}
              </span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Consumo Semanal</span>
              <span className="text-base font-black text-white mt-1 block">
                {metricsForSelected.avgWeeklyConsumption > 0 
                  ? `~${metricsForSelected.avgWeeklyConsumption.toFixed(1)} ${selectedProduct.unit}`
                  : '—'}
              </span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Média Mensal</span>
              <span className="text-base font-black text-rose-300 mt-1 block">
                {metricsForSelected.avgMonthlyConsumption > 0 
                  ? `~${metricsForSelected.avgMonthlyConsumption.toFixed(1)} ${selectedProduct.unit}`
                  : '—'}
              </span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Duração do Estoque</span>
              <span className="text-base font-black text-amber-300 mt-1 block">
                {metricsForSelected.daysOfStockEstimated !== null && metricsForSelected.daysOfStockEstimated < 900
                  ? `~${metricsForSelected.daysOfStockEstimated} dias`
                  : 'Suficiente'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabela / Lista de Consumos Realizados */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-white/40 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Histórico de Consumos Registrados
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredConsumptions.length} {filteredConsumptions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {filteredConsumptions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <TrendingDown className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Nenhum consumo registrado neste filtro</p>
            <p className="text-xs text-slate-400">Toque em "Registrar Consumo" para adicionar o primeiro item.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/30">
            {filteredConsumptions.map((c) => {
              const prod = products.find(p => p.id === c.product_id);
              const member = members.find(m => m.id === c.member_id);
              const cat = categories.find(cat => cat.id === prod?.category_id);

              return (
                <div key={c.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/60 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{prod?.name || 'Produto'}</h4>
                        {cat && (
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: cat.color || '#4f46e5' }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {c.date.split('-').reverse().join('/')}
                        </span>
                        {member && (
                          <span className="flex items-center gap-1">
                            • <User className="w-3 h-3" /> {member.name}
                          </span>
                        )}
                        {c.notes && (
                          <span className="hidden sm:inline italic text-slate-400">
                            • "{c.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-rose-600">
                      -{c.quantity} <span className="text-xs font-semibold text-slate-500">{c.unit}</span>
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
