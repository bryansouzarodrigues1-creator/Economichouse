import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Users, ChefHat, AlertCircle } from 'lucide-react';
import { Recipe, RecipeIngredient, Product, ProductUnit, UserMember } from '../types';
import { getCompatibleUnits, formatUnitDisplay, normalizeUnit } from '../utils/units';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: Omit<Recipe, 'id' | 'house_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  recipeToEdit?: Recipe | null;
  products: Product[];
  members: UserMember[];
  activeMemberId?: string;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recipeToEdit,
  products,
  members,
  activeMemberId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(30);
  const [servings, setServings] = useState<number>(4);
  const [createdByMemberId, setCreatedByMemberId] = useState<string>(activeMemberId || members[0]?.id || '');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [ingredients, setIngredients] = useState<Omit<RecipeIngredient, 'id' | 'recipe_id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name || '');
      setDescription(recipeToEdit.description || '');
      setPrepTimeMinutes(recipeToEdit.prep_time_minutes || 30);
      setServings(recipeToEdit.servings || 4);
      setCreatedByMemberId(recipeToEdit.created_by_member_id || activeMemberId || members[0]?.id || '');
      setInstructions(
        recipeToEdit.instructions && recipeToEdit.instructions.length > 0 
          ? [...recipeToEdit.instructions] 
          : ['']
      );
      setIngredients(
        recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0
          ? recipeToEdit.ingredients.map(ing => ({
              product_id: ing.product_id,
              product_name: ing.product_name,
              quantity: ing.quantity,
              unit: ing.unit,
              is_optional: !!ing.is_optional,
              notes: ing.notes || '',
            }))
          : []
      );
    } else {
      // Novo cadastro
      setName('');
      setDescription('');
      setPrepTimeMinutes(30);
      setServings(4);
      setCreatedByMemberId(activeMemberId || members[0]?.id || '');
      setInstructions(['']);
      setIngredients([]);
    }
    setError(null);
  }, [recipeToEdit, isOpen, activeMemberId, members]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    const firstProduct = products[0];
    setIngredients(prev => [
      ...prev,
      {
        product_id: firstProduct ? firstProduct.id : '',
        product_name: firstProduct ? firstProduct.name : '',
        quantity: 1,
        unit: firstProduct ? firstProduct.unit : 'unidade',
        is_optional: false,
        notes: '',
      },
    ]);
  };

  const handleUpdateIngredient = (
    index: number,
    field: keyof Omit<RecipeIngredient, 'id' | 'recipe_id'>,
    value: any
  ) => {
    setIngredients(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'product_id') {
        const prod = products.find(p => p.id === value);
        item.product_id = value;
        item.product_name = prod ? prod.name : '';
        if (prod) {
          // Ajusta a unidade padrão para a unidade do produto
          item.unit = prod.unit;
        }
      } else {
        (item as any)[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    setInstructions(prev => [...prev, '']);
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    setInstructions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Por favor, informe o nome da receita.');
      return;
    }

    if (ingredients.length === 0) {
      setError('Adicione pelo menos um ingrediente para a receita.');
      return;
    }

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      if (!ing.product_id) {
        setError(`Selecione o produto para o ingrediente #${i + 1}.`);
        return;
      }
      if (!ing.quantity || Number(ing.quantity) <= 0) {
        setError(`Informe uma quantidade válida e maior que zero para o ingrediente #${i + 1}.`);
        return;
      }
    }

    const cleanInstructions = instructions.map(s => s.trim()).filter(Boolean);

    try {
      setIsSubmitting(true);
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
        prep_time_minutes: Math.max(1, Number(prepTimeMinutes) || 15),
        servings: Math.max(1, Number(servings) || 1),
        created_by_member_id: createdByMemberId || undefined,
        instructions: cleanInstructions,
        ingredients: ingredients.map(ing => ({
          ...ing,
          id: '',
          recipe_id: '',
          quantity: Number(ing.quantity),
          unit: ing.unit as ProductUnit,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar receita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-recipe-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-recipe-title" className="text-xl font-bold text-slate-800">
                {recipeToEdit ? 'Editar Receita' : 'Nova Receita da Família'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre os ingredientes conectados aos produtos da despensa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition shadow-xs"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados Gerais */}
          <div className="space-y-4">
            <div>
              <label htmlFor="recipe-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Receita *
              </label>
              <input
                id="recipe-name-input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Arroz com Ovos Caipira, Bolo de Cenoura da Vovó..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="recipe-desc-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descrição ou Ocasião (Opcional)
              </label>
              <input
                id="recipe-desc-input"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Prato prático para almoço de domingo, lanche rápido..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="recipe-prep-time" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tempo (minutos)</span>
                </label>
                <input
                  id="recipe-prep-time"
                  type="number"
                  min="1"
                  step="1"
                  value={prepTimeMinutes}
                  onChange={e => setPrepTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="recipe-servings" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Porções Base</span>
                </label>
                <input
                  id="recipe-servings"
                  type="number"
                  min="1"
                  step="1"
                  value={servings}
                  onChange={e => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="recipe-creator" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cadastrada por
                </label>
                <select
                  id="recipe-creator"
                  value={createdByMemberId}
                  onChange={e => setCreatedByMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ingredientes Conectados ao Estoque */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Ingredientes & Quantidades
                </h3>
                <p className="text-xs text-slate-500">
                  Vincule cada item a um produto da despensa para o cálculo automático
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ingrediente</span>
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-2">
                  Nenhum ingrediente adicionado ainda.
                </p>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-4 py-1.5 rounded-full bg-rose-500 text-white font-bold text-xs shadow-xs hover:bg-rose-600 transition"
                >
                  + Adicionar Primeiro Ingrediente
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ingredients.map((ing, idx) => {
                  const selectedProduct = products.find(p => p.id === ing.product_id);
                  const compatibleUnits = selectedProduct ? getCompatibleUnits(selectedProduct.unit) : ['unidade', 'kg', 'g', 'L', 'ml', 'pacote'];

                  return (
                    <div 
                      key={idx} 
                      className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* Seletor do Produto */}
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Produto na Despensa *
                          </label>
                          <select
                            value={ing.product_id}
                            onChange={e => handleUpdateIngredient(idx, 'product_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-1 focus:ring-rose-500 outline-none"
                          >
                            <option value="">-- Selecione o produto --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Atual: {formatUnitDisplay(p.current_stock || 0, p.unit)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantidade */}
                        <div className="w-24">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Qtd. *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={ing.quantity}
                            onChange={e => handleUpdateIngredient(idx, 'quantity', parseFloat(e.target.value) || '')}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 outline-none"
                          />
                        </div>

                        {/* Unidade */}
                        <div className="w-24">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Unidade *
                          </label>
                          <select
                            value={ing.unit}
                            onChange={e => handleUpdateIngredient(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 outline-none"
                          >
                            {compatibleUnits.map(u => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition self-end shrink-0"
                          title="Remover ingrediente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={ing.notes || ''}
                            onChange={e => handleUpdateIngredient(idx, 'notes', e.target.value)}
                            placeholder="Nota opcional (ex: picadinha, ralado, a gosto)..."
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 focus:ring-1 focus:ring-rose-500 outline-none"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-600 shrink-0">
                          <input
                            type="checkbox"
                            checked={ing.is_optional}
                            onChange={e => handleUpdateIngredient(idx, 'is_optional', e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] font-medium text-slate-700">Ingrediente opcional</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modo de Preparo (Passo a Passo) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Modo de Preparo (Passo a Passo)
                </h3>
                <p className="text-xs text-slate-500">
                  Instruções simples para qualquer familiar seguir na cozinha
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Passo</span>
              </button>
            </div>

            <div className="space-y-2">
              {instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={step}
                    onChange={e => handleUpdateInstruction(idx, e.target.value)}
                    placeholder={`Passo ${idx + 1}: ex: Refogue a cebola picadinha...`}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none resize-y"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition mt-1 shrink-0"
                      title="Remover passo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-200 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : (recipeToEdit ? 'Atualizar Receita' : 'Salvar Receita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
