import React, { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { Product, Category, ProductUnit } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  productToEdit?: Product | null;
  onSaveProduct: (data: Omit<Product, 'id' | 'house_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateProduct: (productId: string, data: Partial<Product>) => Promise<void>;
  onOpenAddCategory: () => void;
}

const COMMON_UNITS: ProductUnit[] = [
  'kg',
  'g',
  'L',
  'ml',
  'unidade',
  'pacote',
  'caixa',
  'rolo',
  'dúzia',
  'bandeja',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  productToEdit,
  onSaveProduct,
  onUpdateProduct,
  onOpenAddCategory,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('unidade');
  const [currentStock, setCurrentStock] = useState<number>(1);
  const [minStockAlert, setMinStockAlert] = useState<number>(0);
  const [lastPurchasePrice, setLastPurchasePrice] = useState<string>('');
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategoryId(productToEdit.category_id);
      setUnit(productToEdit.unit);
      setCurrentStock(productToEdit.current_stock);
      setMinStockAlert(productToEdit.min_stock_alert || 0);
      setLastPurchasePrice(productToEdit.last_purchase_price ? productToEdit.last_purchase_price.toString() : '');
      setLastPurchaseDate(productToEdit.last_purchase_date || '');
      setNotes(productToEdit.notes || '');
    } else {
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setUnit('unidade');
      setCurrentStock(1);
      setMinStockAlert(0);
      setLastPurchasePrice('');
      setLastPurchaseDate('');
      setNotes('');
    }
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;
    setIsSubmitting(true);

    try {
      const priceVal = lastPurchasePrice ? parseFloat(lastPurchasePrice.replace(',', '.')) : undefined;
      const payload = {
        name: name.trim(),
        category_id: categoryId,
        unit,
        current_stock: Number(currentStock),
        min_stock_alert: Number(minStockAlert) || 0,
        last_purchase_price: priceVal,
        last_purchase_date: lastPurchaseDate || undefined,
        notes: notes.trim() || undefined,
      };

      if (productToEdit) {
        await onUpdateProduct(productToEdit.id, payload);
      } else {
        await onSaveProduct(payload);
      }
      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar produto: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white/85 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-white/60 backdrop-blur-md border-b border-white/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h2>
              <p className="text-xs text-slate-500">Alimentos, limpeza, farmácia ou itens de higiene</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Arroz Tipo 1, Sabonete, Detergente..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-base font-semibold bg-white/80 border border-white/60 rounded-2xl px-4 py-3 focus:border-rose-400 outline-none shadow-2xs"
            />
          </div>

          {/* Categoria com atalho para nova categoria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoria *
              </label>
              <button
                type="button"
                onClick={onOpenAddCategory}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Categoria
              </button>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full text-sm font-semibold bg-white/80 border border-white/60 rounded-2xl px-4 py-3 focus:border-rose-400 outline-none shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unidade de Medida e Estoque Atual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Unidade *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full text-sm font-semibold bg-white/80 border border-white/60 rounded-2xl px-4 py-3 focus:border-rose-400 outline-none shadow-2xs"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estoque Atual *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold text-center bg-white/80 border border-white/60 rounded-2xl px-4 py-3 focus:border-rose-400 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Alerta de Estoque Mínimo e Preço de Compra Recente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alerta Mínimo
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 2"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseFloat(e.target.value) || 0)}
                className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl px-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Avisa quando atingir este limite</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço Recente (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 28,50"
                value={lastPurchasePrice}
                onChange={(e) => setLastPurchasePrice(e.target.value)}
                className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl px-3.5 py-2.5 focus:border-rose-400 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações ou Marca Favorita
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Pacote de 5kg tipo 1, preferência pela marca X..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm bg-white/80 border border-white/60 rounded-2xl p-3 focus:border-rose-400 outline-none resize-none shadow-2xs"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-md shadow-rose-100 transition active:scale-98"
            >
              {isSubmitting ? 'Salvando...' : productToEdit ? 'Atualizar Produto' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
