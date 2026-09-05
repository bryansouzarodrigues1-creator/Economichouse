import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Edit3, 
  Trash2, 
  ShoppingCart,
  Filter,
  Flame
} from 'lucide-react';
import { Recipe, Product, UserMember } from '../types';
import { calculateRecipeAvailability, sortRecipesByAvailability } from '../utils/recipeEngine';
import { RecipeModal } from '../components/RecipeModal';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { formatUnitDisplay } from '../utils/units';

interface RecipesViewProps {
  recipes: Recipe[];
  products: Product[];
  members: UserMember[];
  activeMemberId?: string;
  onSaveRecipe: (recipeData: Omit<Recipe, 'id' | 'house_id' | 'created_at' | 'updated_at'>, recipeId?: string) => Promise<void>;
  onDeleteRecipe: (recipeId: string) => Promise<void>;
  onPrepareRecipe: (recipeId: string, servings: number, memberId?: string) => Promise<void>;
  onAddToShoppingList: (productName: string, quantityNeeded: number, unit: string, productId?: string) => void;
}

type FilterType = 'all' | 'can_make_now' | 'missing_few' | 'my_recipes';

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  products,
  members,
  activeMemberId,
  onSaveRecipe,
  onDeleteRecipe,
  onPrepareRecipe,
  onAddToShoppingList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Calcula e ordena receitas por disponibilidade determinística
  const recipesWithAvailability = useMemo(() => {
    return sortRecipesByAvailability(recipes, products);
  }, [recipes, products]);

  // Contadores para os filtros
  const counts = useMemo(() => {
    let canMake = 0;
    let missingFew = 0;
    let myRecipes = 0;

    for (const item of recipesWithAvailability) {
      if (item.availability.status === 'can_make_now') canMake++;
      if (item.availability.status === 'missing_one' || item.availability.status === 'missing_few') missingFew++;
      if (activeMemberId && item.recipe.created_by_member_id === activeMemberId) myRecipes++;
    }

    return {
      all: recipes.length,
      can_make_now: canMake,
      missing_few: missingFew,
      my_recipes: myRecipes,
    };
  }, [recipesWithAvailability, recipes.length, activeMemberId]);

  // Receitas prontas para cozinhar agora (Seção de destaque)
  const readyToCookRecipes = useMemo(() => {
    return recipesWithAvailability.filter(
      item => item.availability.status === 'can_make_now' || item.availability.status === 'missing_one'
    );
  }, [recipesWithAvailability]);

  // Filtro e busca textual
  const filteredRecipes = useMemo(() => {
    return recipesWithAvailability.filter(item => {
      const { recipe, availability } = item;

      // Filtro de status
      if (activeFilter === 'can_make_now' && availability.status !== 'can_make_now') return false;
      if (activeFilter === 'missing_few' && availability.status !== 'missing_one' && availability.status !== 'missing_few') return false;
      if (activeFilter === 'my_recipes' && recipe.created_by_member_id !== activeMemberId) return false;

      // Busca por nome de receita ou nome de ingrediente
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(query);
        const matchesDesc = recipe.description?.toLowerCase().includes(query);
        const matchesIngredient = recipe.ingredients?.some(ing => {
          const prod = products.find(p => p.id === ing.product_id);
          return (prod?.name.toLowerCase().includes(query)) || (ing.product_name?.toLowerCase().includes(query));
        });

        if (!matchesName && !matchesDesc && !matchesIngredient) return false;
      }

      return true;
    });
  }, [recipesWithAvailability, activeFilter, searchTerm, activeMemberId, products]);

  const handleEditClick = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsCreateModalOpen(true);
  };

  const handleSaveModal = async (data: Omit<Recipe, 'id' | 'house_id' | 'created_at' | 'updated_at'>) => {
    await onSaveRecipe(data, recipeToEdit?.id);
    setRecipeToEdit(null);
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    await onDeleteRecipe(recipeToDelete.id);
    setRecipeToDelete(null);
    if (selectedRecipeForDetail?.id === recipeToDelete.id) {
      setSelectedRecipeForDetail(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header com Frosted Glass */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2.5rem] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Receitas Familiares
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Conectadas diretamente ao estoque da despensa e ao consumo da casa
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setRecipeToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md shadow-rose-200 active:scale-95 transition text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nova Receita</span>
          </button>
        </div>
      </div>

      {/* 2. Destaque: "O que posso fazer com o que tenho?" */}
      {readyToCookRecipes.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50/80 via-white/80 to-amber-50/60 backdrop-blur-md rounded-[2.5rem] p-6 border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>O que posso fazer com o que tenho?</span>
                  <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    {readyToCookRecipes.length} sugestões
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Receitas 100% disponíveis ou que precisam de apenas 1 ingrediente adicional
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {readyToCookRecipes.slice(0, 3).map(({ recipe, availability }) => {
              const isFull = availability.status === 'can_make_now';

              return (
                <div 
                  key={recipe.id}
                  className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-rose-600 transition">
                        {recipe.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                        isFull
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isFull ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{isFull ? 'Fazer Agora' : 'Falta 1'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {recipe.prep_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {recipe.prep_time_minutes} min
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {recipe.servings} porções
                        </span>
                      )}
                      <span>
                        {recipe.ingredients?.length || 0} ingredientes
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {availability.statusBadge.sublabel}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedRecipeForDetail(recipe)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>🍳 Fazer Receita</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Barra de Busca e Filtros */}
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-white/40 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar receita ou ingrediente (ex: arroz, ovos, bolo)..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/80 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
              activeFilter === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
          >
            Todas ({counts.all})
          </button>

          <button
            onClick={() => setActiveFilter('can_make_now')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeFilter === 'can_make_now'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Posso fazer agora ({counts.can_make_now})</span>
          </button>

          <button
            onClick={() => setActiveFilter('missing_few')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeFilter === 'missing_few'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Falta pouco ({counts.missing_few})</span>
          </button>

          {activeMemberId && (
            <button
              onClick={() => setActiveFilter('my_recipes')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                activeFilter === 'my_recipes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Minhas ({counts.my_recipes})
            </button>
          )}
        </div>
      </div>

      {/* 4. Lista Principal de Receitas */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/40 shadow-xs text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma receita encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm 
              ? `Nenhuma receita corresponde à busca "${searchTerm}". Tente pesquisar por outro nome ou ingrediente.`
              : 'Cadastre as receitas favoritas da família para descobrir automaticamente o que é possível cozinhar com os ingredientes atuais da despensa.'}
          </p>
          <button
            onClick={() => {
              setRecipeToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 transition"
          >
            + Cadastrar Nova Receita
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecipes.map(({ recipe, availability }) => {
            const isFull = availability.status === 'can_make_now';
            const creator = members.find(m => m.id === recipe.created_by_member_id);

            return (
              <div
                key={recipe.id}
                className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-xs p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                {/* Header do Card */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">
                        {recipe.name}
                      </h3>
                      {creator && (
                        <span className="text-[11px] text-slate-400">
                          Cadastrada por {creator.name}
                        </span>
                      )}
                    </div>

                    {/* Badge de Disponibilidade */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                      availability.status === 'can_make_now'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : availability.status === 'missing_one' || availability.status === 'missing_few'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {availability.status === 'can_make_now' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : availability.status === 'missing_one' || availability.status === 'missing_few' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>{availability.statusBadge.label}</span>
                    </span>
                  </div>

                  {recipe.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {recipe.description}
                    </p>
                  )}

                  {/* Informações Rápidas */}
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                    {recipe.prep_time_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {recipe.prep_time_minutes} min
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {recipe.servings} porções
                      </span>
                    )}
                    <span>
                      {recipe.ingredients?.length || 0} ingredientes
                    </span>
                  </div>
                </div>

                {/* Resumo de Ingredientes Faltantes */}
                {availability.missingIngredientsList.length > 0 && (
                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 text-xs space-y-1.5">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Falta para fazer esta receita:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {availability.missingIngredientsList.slice(0, 2).map((m, i) => (
                        <span key={i} className="bg-white/80 px-2 py-0.5 rounded-lg text-amber-900 font-medium text-[11px] border border-amber-200/50">
                          {m.name} (+{formatUnitDisplay(m.deficit, m.unit)})
                        </span>
                      ))}
                      {availability.missingIngredientsList.length > 2 && (
                        <span className="text-[10px] text-amber-700 font-medium">
                          +{availability.missingIngredientsList.length - 2} outros
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações do Card */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(recipe)}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
                      title="Editar receita"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecipeToDelete(recipe)}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                      title="Excluir receita"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedRecipeForDetail(recipe)}
                    className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>🍳 Fazer Receita</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <RecipeModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setRecipeToEdit(null);
        }}
        onSave={handleSaveModal}
        recipeToEdit={recipeToEdit}
        products={products}
        members={members}
        activeMemberId={activeMemberId}
      />

      {/* Modal de Detalhes e Preparação da Receita */}
      <RecipeDetailModal
        isOpen={!!selectedRecipeForDetail}
        onClose={() => setSelectedRecipeForDetail(null)}
        recipe={selectedRecipeForDetail}
        products={products}
        members={members}
        activeMemberId={activeMemberId}
        onEdit={handleEditClick}
        onPrepare={onPrepareRecipe}
        onAddToShoppingList={onAddToShoppingList}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full border border-white/60 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Excluir Receita?
            </h3>
            <p className="text-xs text-slate-500">
              Tem certeza que deseja excluir a receita <strong>"{recipeToDelete.name}"</strong>? O histórico de preparos anteriores continuará salvo no consumo.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRecipeToDelete(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
