import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Users, 
  ChefHat, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Edit3, 
  Info,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Recipe, Product, UserMember } from '../types';
import { calculateRecipeAvailability } from '../utils/recipeEngine';
import { formatUnitDisplay } from '../utils/units';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  products: Product[];
  members: UserMember[];
  activeMemberId?: string;
  onEdit: (recipe: Recipe) => void;
  onPrepare: (recipeId: string, servings: number, memberId?: string) => Promise<void>;
  onAddToShoppingList: (productName: string, quantityNeeded: number, unit: string, productId?: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  recipe,
  products,
  members,
  activeMemberId,
  onEdit,
  onPrepare,
  onAddToShoppingList,
}) => {
  const [targetServings, setTargetServings] = useState<number>(recipe?.servings || 4);
  const [showConfirmPrepare, setShowConfirmPrepare] = useState(false);
  const [cookMemberId, setCookMemberId] = useState<string>(activeMemberId || members[0]?.id || '');
  const [isPreparing, setIsPreparing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sincroniza porções quando a receita abre
  React.useEffect(() => {
    if (recipe) {
      setTargetServings(recipe.servings || 4);
      setShowConfirmPrepare(false);
      setActionMessage(null);
      setCookMemberId(activeMemberId || recipe.created_by_member_id || members[0]?.id || '');
    }
  }, [recipe, isOpen, activeMemberId, members]);

  if (!isOpen || !recipe) return null;

  // Cálculo determinístico em tempo real baseado no número de porções escolhido
  const availability = calculateRecipeAvailability(recipe, products, targetServings);
  const creator = members.find(m => m.id === recipe.created_by_member_id);

  const handleIncrementServings = () => {
    setTargetServings(prev => Math.min(20, prev + 1));
  };

  const handleDecrementServings = () => {
    setTargetServings(prev => Math.max(1, prev - 1));
  };

  const handleConfirmPreparation = async () => {
    try {
      setIsPreparing(true);
      setActionMessage(null);
      await onPrepare(recipe.id, targetServings, cookMemberId);
      setActionMessage({
        type: 'success',
        text: `Receita preparada com sucesso! O consumo dos ingredientes foi registrado no histórico e debitado do estoque da despensa.`
      });
      setShowConfirmPrepare(false);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Erro ao registrar consumo da receita.'
      });
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-recipe-detail-title"
      >
        {/* Header com Frosted Glass */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/70 to-pink-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-recipe-detail-title" className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
                  {recipe.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                {creator ? `Receita de ${creator.name}` : 'Receita da família'}
                {recipe.prep_time_minutes ? ` • ${recipe.prep_time_minutes} minutos` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(recipe);
              }}
              className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition shadow-2xs"
              title="Editar receita"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition shadow-2xs"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mensagens de Ação */}
          {actionMessage && (
            <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{actionMessage.text}</span>
            </div>
          )}

          {/* Banner de Status de Disponibilidade */}
          <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            availability.status === 'can_make_now'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : availability.status === 'missing_one' || availability.status === 'missing_few'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                availability.status === 'can_make_now'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : availability.status === 'missing_one' || availability.status === 'missing_few'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'bg-rose-500 text-white shadow-md shadow-rose-200'
              }`}>
                {availability.status === 'can_make_now' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : availability.status === 'missing_one' || availability.status === 'missing_few' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {availability.statusBadge.label}
                </h3>
                <p className="text-xs opacity-85">
                  {availability.statusBadge.sublabel}
                </p>
              </div>
            </div>

            {/* Ajuste Dinâmico de Porções */}
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/60 shadow-2xs self-start sm:self-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Porções:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrementServings}
                  disabled={targetServings <= 1}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition disabled:opacity-30"
                  title="Diminuir porção"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-sm text-slate-800 w-6 text-center">
                  {targetServings}
                </span>
                <button
                  type="button"
                  onClick={handleIncrementServings}
                  disabled={targetServings >= 20}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition disabled:opacity-30"
                  title="Aumentar porção"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {recipe.description && (
            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              {recipe.description}
            </p>
          )}

          {/* Lista de Ingredientes com Checagem de Estoque em Tempo Real */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Ingredientes para {targetServings} {targetServings === 1 ? 'porção' : 'porções'}</span>
                {availability.portionFactor !== 1 && (
                  <span className="text-[10px] lowercase font-normal text-slate-400">
                    (ajustado de {recipe.servings} porções)
                  </span>
                )}
              </h3>
              <span className="text-xs font-medium text-slate-500">
                {availability.availableMandatoryCount} de {availability.totalMandatoryCount} disponíveis
              </span>
            </div>

            <div className="space-y-2">
              {availability.ingredients.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    item.status === 'available'
                      ? 'bg-white/80 border-emerald-100'
                      : item.isOptional
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-amber-50/40 border-amber-200/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      item.status === 'available'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.isOptional
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status === 'available' ? '✓' : item.isOptional ? '○' : '!'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">
                          {item.productName}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {formatUnitDisplay(item.scaledQuantity, item.unit)}
                        </span>
                        {item.isOptional && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Opcional
                          </span>
                        )}
                      </div>
                      {item.ingredient.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Nota: {item.ingredient.notes}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${
                        item.status === 'available' ? 'text-emerald-700' : 'text-amber-800'
                      }`}>
                        {item.statusMessage}
                      </p>
                    </div>
                  </div>

                  {/* Ação rápida caso falte: Adicionar à lista de compras */}
                  {item.status !== 'available' && item.deficit > 0 && (
                    <button
                      type="button"
                      onClick={() => onAddToShoppingList(item.productName, item.deficit, item.deficitUnit, item.product?.id)}
                      className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 font-bold text-xs transition shadow-2xs"
                      title="Adicionar quantidade que falta à Lista Inteligente de Compras"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Comprar (+{formatUnitDisplay(item.deficit, item.deficitUnit)})</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {availability.optionalMissingNotes.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {availability.optionalMissingNotes.join(' ')}
                </span>
              </div>
            )}
          </div>

          {/* Modo de Preparo */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Modo de Preparo
              </h3>
              <div className="space-y-2.5">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 rounded-2xl border border-white/60 shadow-2xs">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diálogo de Confirmação de Preparação Atômica */}
          {showConfirmPrepare && (
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-rose-800">
                <Flame className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold">
                  Confirmar Preparo e Débito no Estoque?
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Esta ação consumirá automaticamente as quantidades exatas dos ingredientes do estoque da casa e registrará o consumo no histórico familiar:
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto bg-white/80 p-3 rounded-2xl border border-rose-100 text-xs">
                {availability.ingredients.filter(i => i.status === 'available').map((ing, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">{ing.productName}:</span>
                    <span className="font-bold text-rose-600">
                      -{formatUnitDisplay(ing.scaledQuantity, ing.unit)}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quem preparou esta refeição?
                </label>
                <select
                  value={cookMemberId}
                  onChange={e => setCookMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmPrepare(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPreparing}
                  onClick={handleConfirmPreparation}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPreparing ? 'Consumindo estoque...' : 'Sim, Confirmar Consumo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {availability.canPrepare ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pronta para cozinhar!
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Faltam ingredientes obrigatórios.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {!showConfirmPrepare && (
              <>
                {!availability.canPrepare && availability.missingIngredientsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      for (const missing of availability.missingIngredientsList) {
                        onAddToShoppingList(missing.name, missing.deficit, missing.unit, missing.productId);
                      }
                      setActionMessage({
                        type: 'success',
                        text: `Itens faltantes adicionados à Lista Inteligente de Compras!`
                      });
                    }}
                    className="px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Adicionar faltantes às compras</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!availability.canPrepare}
                  onClick={() => setShowConfirmPrepare(true)}
                  className={`px-6 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 shadow-md ${
                    availability.canPrepare
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-200 active:scale-95 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title={availability.canPrepare ? 'Registrar o preparo desta receita e debitar ingredientes' : 'Você precisa repor os ingredientes que faltam'}
                >
                  <ChefHat className="w-4 h-4" />
                  <span>🍳 Fazer Receita</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
