import React, { useState, useEffect } from 'react';
import { X, TrendingDown, ShoppingBag, SlidersHorizontal, Check, Calendar, Store } from 'lucide-react';
import { Product, UserMember } from '../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'consumption' | 'purchase' | 'stock_adjustment';
  products: Product[];
  members: UserMember[];
  activeMemberId?: string;
  preselectedProductId?: string;
  onRecordConsumption: (data: { productId: string; quantity: number; date: string; memberId?: string; notes?: string }) => Promise<void>;
  onRecordPurchase: (data: {
    date: string;
    store_name?: string;
    notes?: string;
    buyer_member_id?: string;
    items: { product_id: string; quantity: number; unit_price: number; notes?: string }[];
  }) => Promise<void>;
  onAdjustStock: (data: { productId: string; newStockValue: number; type: 'manual_adjustment' | 'addition' | 'removal'; reason?: string; memberId?: string }) => Promise<void>;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'consumption',
  products,
  members,
  activeMemberId,
  preselectedProductId,
  onRecordConsumption,
  onRecordPurchase,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'consumption' | 'purchase' | 'stock_adjustment'>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  useEffect(() => {
    if (preselectedProductId && products.some(p => p.id === preselectedProductId)) {
      setSelectedProductId(preselectedProductId);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [preselectedProductId, products, selectedProductId]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleQuickAddQty = (delta: number) => {
    setQuantity(prev => {
      const next = Math.max(0.1, Number((prev + delta).toFixed(2)));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    setFeedbackSuccess(null);

    try {
      if (activeTab === 'consumption') {
        await onRecordConsumption({
          productId: selectedProduct.id,
          quantity: Number(quantity),
          date,
          memberId: activeMemberId,
          notes: notes.trim() || undefined,
        });
        setFeedbackSuccess(`Consumo de ${quantity} ${selectedProduct.unit} de ${selectedProduct.name} registrado com sucesso!`);
      } else if (activeTab === 'purchase') {
        const unitPrice = parseFloat(price.replace(',', '.')) || (selectedProduct.last_purchase_price || 0);
        await onRecordPurchase({
          date,
          store_name: storeName.trim() || undefined,
          notes: notes.trim() || undefined,
          buyer_member_id: activeMemberId,
          items: [
            {
              product_id: selectedProduct.id,
              quantity: Number(quantity),
              unit_price: unitPrice,
              notes: notes.trim() || undefined,
            },
          ],
        });
        setFeedbackSuccess(`Compra de ${quantity} ${selectedProduct.unit} de ${selectedProduct.name} registrada!`);
      } else {
        // Ajuste manual de estoque
        await onAdjustStock({
          productId: selectedProduct.id,
          newStockValue: Number(quantity),
          type: 'manual_adjustment',
          reason: notes.trim() || 'Correção de contagem física em casa',
          memberId: activeMemberId,
        });
        setFeedbackSuccess(`Estoque de ${selectedProduct.name} corrigido para ${quantity} ${selectedProduct.unit}!`);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setFeedbackSuccess(null);
        onClose();
      }, 900);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Pré-visualização do impacto no estoque
  const currentStock = selectedProduct ? Number(selectedProduct.current_stock || 0) : 0;
  let simulatedNextStock = currentStock;
  if (activeTab === 'consumption') {
    simulatedNextStock = Math.max(0, currentStock - quantity);
  } else if (activeTab === 'purchase') {
    simulatedNextStock = currentStock + quantity;
  } else {
    simulatedNextStock = quantity;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white/85 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        
        {/* Header com Tabs grandes para facilitar para a mãe */}
        <div className="p-5 bg-white/60 backdrop-blur-md border-b border-white/40">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Registrar Movimentação
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/5 rounded-2xl border border-white/40">
            <button
              type="button"
              onClick={() => { setActiveTab('consumption'); setQuantity(1); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'consumption'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Consumo</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('purchase'); setQuantity(1); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'purchase'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <span>Compra</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setActiveTab('stock_adjustment'); 
                if (selectedProduct) setQuantity(selectedProduct.current_stock); 
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'stock_adjustment'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>Ajuste</span>
            </button>
          </div>
        </div>

        {/* Formulário com controles grandes e claros */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {feedbackSuccess ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50/80 backdrop-blur-xs rounded-[2rem] border border-emerald-200">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <p className="text-base font-bold text-emerald-900">{feedbackSuccess}</p>
            </div>
          ) : (
            <>
              {/* 1. Escolha do Produto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qual produto?
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (activeTab === 'stock_adjustment' && prod) {
                      setQuantity(prod.current_stock);
                    }
                  }}
                  className="w-full text-base font-semibold text-slate-800 bg-white/80 border border-white/60 rounded-2xl px-4 py-3.5 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition outline-none shadow-2xs"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Quantidade com botões rápidos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {activeTab === 'consumption' ? 'Quanto foi consumido?' : activeTab === 'purchase' ? 'Quantidade comprada:' : 'Novo estoque real:'}
                  </label>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    Unidade: {selectedProduct?.unit || 'unidade'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full text-center text-2xl font-black text-slate-800 bg-white/80 border border-white/60 rounded-2xl py-3 focus:border-rose-400 focus:bg-white transition outline-none shadow-2xs"
                    required
                  />
                </div>

                {/* Botões rápidos com incremento/decremento para facilidade no celular */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[0.5, 1, 2, 5].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAddQty(amt)}
                      className="py-2.5 rounded-xl bg-white/70 hover:bg-white border border-white/50 active:scale-95 text-xs font-bold text-slate-700 shadow-2xs transition"
                    >
                      +{amt} {selectedProduct?.unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informações adicionais quando for Compra */}
              {activeTab === 'purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preço unitário (R$):
                    </label>
                    <input
                      type="text"
                      placeholder={selectedProduct?.last_purchase_price ? `Ex: ${selectedProduct.last_purchase_price.toFixed(2)}` : 'Ex: 5,90'}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-sm font-semibold bg-white/80 border border-white/60 rounded-2xl px-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mercado / Local (opcional):
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="Ex: Supermercado São José"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl pl-10 pr-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Data e observação simples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data:
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl pl-10 pr-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anotação (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Almoço de domingo"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl px-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Painel de Cálculo em Tempo Real (Demonstração da transparência) */}
              <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                    Cálculo Determinístico de Estoque:
                  </span>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Estoque anterior: <strong className="text-slate-800">{currentStock} {selectedProduct?.unit}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Novo estoque:</span>
                  <span className="text-base font-extrabold text-rose-600">
                    {simulatedNextStock} {selectedProduct?.unit}
                  </span>
                </div>
              </div>

              {/* Botão de Gravar bem grande para celular */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-confirm-quick-action"
                  className={`w-full py-4 rounded-full text-base font-extrabold text-white shadow-md active:scale-98 transition flex items-center justify-center gap-2 ${
                    activeTab === 'consumption'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-100'
                      : activeTab === 'purchase'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-100'
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-100'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>
                    {isSubmitting 
                      ? 'Salvando...' 
                      : activeTab === 'consumption'
                      ? `Confirmar Consumo de ${quantity} ${selectedProduct?.unit}`
                      : activeTab === 'purchase'
                      ? `Registrar Compra de ${quantity} ${selectedProduct?.unit}`
                      : `Atualizar Estoque para ${quantity} ${selectedProduct?.unit}`}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
