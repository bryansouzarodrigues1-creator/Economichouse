import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import { Category } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string, icon?: string, color?: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddCategory(newCategoryName.trim(), 'Layers', selectedColor);
      setNewCategoryName('');
      onClose();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-5 bg-white/60 backdrop-blur-md border-b border-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Categorias da Casa</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nova Categoria Form */}
          <form onSubmit={handleCreate} className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Criar Nova Categoria</h3>
            <input
              type="text"
              required
              placeholder="Ex: Frutas, Congelados, Bebê..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full text-sm bg-white/80 border border-white/60 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 shadow-2xs"
            />
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cor do marcador:</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition ${selectedColor === c ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adicionando...' : 'Adicionar Categoria'}</span>
            </button>
          </form>

          {/* Lista de Categorias Existentes */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categorias Atuais ({categories.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color || '#4f46e5' }} />
                  <span className="text-xs font-semibold text-slate-800 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
