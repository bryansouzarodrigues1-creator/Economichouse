/**
 * CasaControle - Motor Determinístico de Receitas e Integração com Estoque
 * 
 * Regra Estrita:
 * Nenhum cálculo proporcional ou checagem de ingredientes usa IA.
 * Todos os cálculos de porções, compatibilidade de grandezas e verificação de
 * suficiência de estoque são matematicamente determinísticos e auditáveis.
 */

import { Recipe, RecipeIngredient, Product, ProductUnit } from '../types';
import { roundPrecision, safeMul, safeSub, clampNonNegative } from './math';
import { areUnitsCompatible, convertUnitQuantity, formatUnitDisplay, normalizeUnit } from './units';

export type IngredientStockStatus = 
  | 'available'          // Disponível na quantidade necessária
  | 'insufficient'       // Existe no estoque, mas quantidade é menor que o necessário
  | 'missing'            // Não existe no estoque (estoque zero ou produto não cadastrado)
  | 'incompatible_units';// Grandezas físicas não conversíveis (ex: kg vs unidade)

export interface IngredientAvailability {
  ingredient: RecipeIngredient;
  product?: Product;
  productName: string;
  scaledQuantity: number;
  unit: ProductUnit;
  isOptional: boolean;
  status: IngredientStockStatus;
  currentStock: number;
  stockUnit?: ProductUnit;
  neededInStockUnit: number;
  deficit: number;
  deficitUnit: ProductUnit;
  statusMessage: string;
}

export type RecipeAvailabilityStatus = 
  | 'can_make_now'    // 🟢 Posso fazer agora (todos os obrigatórios disponíveis)
  | 'missing_one'     // 🟡 Falta 1 ingrediente
  | 'missing_few'     // 🟡 Falta pouco (2 a 3 ingredientes)
  | 'missing_many';   // 🔴 Faltam vários ingredientes (> 3)

export interface RecipeAvailabilityResult {
  recipeId: string;
  recipeName: string;
  baseServings: number;
  targetServings: number;
  portionFactor: number;
  status: RecipeAvailabilityStatus;
  statusBadge: {
    label: string;
    sublabel: string;
    color: 'emerald' | 'amber' | 'rose';
    icon: 'check' | 'alert' | 'x';
  };
  ingredients: IngredientAvailability[];
  canPrepare: boolean;
  totalMandatoryCount: number;
  availableMandatoryCount: number;
  missingMandatoryCount: number;
  missingIngredientsList: {
    name: string;
    neededQty: number;
    unit: ProductUnit;
    currentStock: number;
    deficit: number;
    isOptional: boolean;
    productId?: string;
  }[];
  optionalMissingNotes: string[];
}

/**
 * Calcula a disponibilidade de uma receita com base no estoque atual e nas porções desejadas
 */
export function calculateRecipeAvailability(
  recipe: Recipe,
  products: Product[],
  targetServings?: number
): RecipeAvailabilityResult {
  const baseServings = Math.max(1, recipe.servings || 1);
  const servings = Math.max(1, targetServings || baseServings);
  const portionFactor = servings / baseServings;

  const ingredientsList = recipe.ingredients || [];
  const evaluatedIngredients: IngredientAvailability[] = [];
  const missingIngredientsList: RecipeAvailabilityResult['missingIngredientsList'] = [];
  const optionalMissingNotes: string[] = [];

  let mandatoryCount = 0;
  let availableMandatoryCount = 0;

  for (const ing of ingredientsList) {
    const isOptional = !!ing.is_optional;
    if (!isOptional) mandatoryCount++;

    // Proporção de porções com precisão de 3 casas
    const scaledQty = roundPrecision(safeMul(ing.quantity, portionFactor, 4), 3);
    const product = products.find(p => p.id === ing.product_id);
    const productName = product ? product.name : (ing.product_name || 'Ingrediente');

    if (!product) {
      // Produto não encontrado no estoque cadastrado
      evaluatedIngredients.push({
        ingredient: ing,
        productName,
        scaledQuantity: scaledQty,
        unit: ing.unit,
        isOptional,
        status: 'missing',
        currentStock: 0,
        neededInStockUnit: scaledQty,
        deficit: scaledQty,
        deficitUnit: ing.unit,
        statusMessage: 'Produto não encontrado na despensa',
      });

      missingIngredientsList.push({
        name: productName,
        neededQty: scaledQty,
        unit: ing.unit,
        currentStock: 0,
        deficit: scaledQty,
        isOptional,
      });

      if (isOptional) {
        optionalMissingNotes.push(`${productName} (opcional) não cadastrado na despensa.`);
      }
      continue;
    }

    const currentStock = roundPrecision(product.current_stock || 0, 3);
    const ingUnit = normalizeUnit(ing.unit);
    const prodUnit = normalizeUnit(product.unit);

    // Validação dimensional rigorosa
    if (!areUnitsCompatible(ingUnit, prodUnit)) {
      evaluatedIngredients.push({
        ingredient: ing,
        product,
        productName: product.name,
        scaledQuantity: scaledQty,
        unit: ing.unit,
        isOptional,
        status: 'incompatible_units',
        currentStock,
        stockUnit: product.unit,
        neededInStockUnit: scaledQty,
        deficit: scaledQty,
        deficitUnit: ing.unit,
        statusMessage: `Unidade da receita (${ing.unit}) é incompatível com a unidade da despensa (${product.unit})`,
      });

      missingIngredientsList.push({
        name: product.name,
        neededQty: scaledQty,
        unit: ing.unit,
        currentStock,
        deficit: scaledQty,
        isOptional,
        productId: product.id,
      });

      if (isOptional) {
        optionalMissingNotes.push(`${product.name} (opcional) com unidade incompatível.`);
      }
      continue;
    }

    // Conversão segura de unidades (ex: 300g para kg -> 0.3kg)
    const neededInStockUnit = convertUnitQuantity(scaledQty, ingUnit, prodUnit);
    if (neededInStockUnit === null) {
      // Falha inesperada de conversão
      evaluatedIngredients.push({
        ingredient: ing,
        product,
        productName: product.name,
        scaledQuantity: scaledQty,
        unit: ing.unit,
        isOptional,
        status: 'incompatible_units',
        currentStock,
        stockUnit: product.unit,
        neededInStockUnit: scaledQty,
        deficit: scaledQty,
        deficitUnit: ing.unit,
        statusMessage: `Erro ao converter grandezas entre ${ing.unit} e ${product.unit}`,
      });
      continue;
    }

    if (currentStock >= neededInStockUnit) {
      // Totalmente disponível
      if (!isOptional) availableMandatoryCount++;

      evaluatedIngredients.push({
        ingredient: ing,
        product,
        productName: product.name,
        scaledQuantity: scaledQty,
        unit: ing.unit,
        isOptional,
        status: 'available',
        currentStock,
        stockUnit: product.unit,
        neededInStockUnit,
        deficit: 0,
        deficitUnit: product.unit,
        statusMessage: `Disponível (${formatUnitDisplay(currentStock, product.unit)} em estoque)`,
      });
    } else {
      // Insuficiente ou zerado
      const deficitInStockUnit = roundPrecision(safeSub(neededInStockUnit, currentStock), 3);
      const isMissing = currentStock <= 0;
      const status: IngredientStockStatus = isMissing ? 'missing' : 'insufficient';

      evaluatedIngredients.push({
        ingredient: ing,
        product,
        productName: product.name,
        scaledQuantity: scaledQty,
        unit: ing.unit,
        isOptional,
        status,
        currentStock,
        stockUnit: product.unit,
        neededInStockUnit,
        deficit: deficitInStockUnit,
        deficitUnit: product.unit,
        statusMessage: isMissing 
          ? `Sem estoque na despensa (precisa de ${formatUnitDisplay(neededInStockUnit, product.unit)})`
          : `Falta ${formatUnitDisplay(deficitInStockUnit, product.unit)} (você tem ${formatUnitDisplay(currentStock, product.unit)})`,
      });

      missingIngredientsList.push({
        name: product.name,
        neededQty: neededInStockUnit,
        unit: product.unit,
        currentStock,
        deficit: deficitInStockUnit,
        isOptional,
        productId: product.id,
      });

      if (isOptional) {
        optionalMissingNotes.push(`${product.name} (opcional) insuficiente: faltam ${formatUnitDisplay(deficitInStockUnit, product.unit)}.`);
      }
    }
  }

  const missingMandatoryCount = mandatoryCount - availableMandatoryCount;
  let status: RecipeAvailabilityStatus;
  let statusBadge: RecipeAvailabilityResult['statusBadge'];

  if (missingMandatoryCount === 0) {
    status = 'can_make_now';
    statusBadge = {
      label: 'Posso fazer agora',
      sublabel: 'Você tem todos os ingredientes necessários!',
      color: 'emerald',
      icon: 'check',
    };
  } else if (missingMandatoryCount === 1) {
    status = 'missing_one';
    const firstMissing = missingIngredientsList.find(m => !m.isOptional);
    statusBadge = {
      label: 'Falta 1 ingrediente',
      sublabel: firstMissing ? `Falta apenas: ${firstMissing.name}` : 'Falta 1 ingrediente obrigatório',
      color: 'amber',
      icon: 'alert',
    };
  } else if (missingMandatoryCount <= 3) {
    status = 'missing_few';
    statusBadge = {
      label: 'Falta pouco',
      sublabel: `Faltam ${missingMandatoryCount} ingredientes obrigatórios`,
      color: 'amber',
      icon: 'alert',
    };
  } else {
    status = 'missing_many';
    statusBadge = {
      label: 'Faltam vários ingredientes',
      sublabel: `Faltam ${missingMandatoryCount} de ${mandatoryCount} ingredientes obrigatórios`,
      color: 'rose',
      icon: 'x',
    };
  }

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    baseServings,
    targetServings: servings,
    portionFactor,
    status,
    statusBadge,
    ingredients: evaluatedIngredients,
    canPrepare: missingMandatoryCount === 0,
    totalMandatoryCount: mandatoryCount,
    availableMandatoryCount,
    missingMandatoryCount,
    missingIngredientsList,
    optionalMissingNotes,
  };
}

/**
 * Ordena lista de receitas priorizando:
 * 1. Receitas 100% disponíveis
 * 2. Receitas que precisam de apenas 1 ingrediente
 * 3. Receitas que precisam de poucos ingredientes (2-3)
 * 4. Demais receitas
 */
export function sortRecipesByAvailability(
  recipes: Recipe[],
  products: Product[]
): { recipe: Recipe; availability: RecipeAvailabilityResult }[] {
  const list = recipes.map(recipe => ({
    recipe,
    availability: calculateRecipeAvailability(recipe, products),
  }));

  const rank = (status: RecipeAvailabilityStatus): number => {
    switch (status) {
      case 'can_make_now': return 0;
      case 'missing_one': return 1;
      case 'missing_few': return 2;
      case 'missing_many': return 3;
    }
  };

  return list.sort((a, b) => {
    const rankDiff = rank(a.availability.status) - rank(b.availability.status);
    if (rankDiff !== 0) return rankDiff;

    const missingDiff = a.availability.missingMandatoryCount - b.availability.missingMandatoryCount;
    if (missingDiff !== 0) return missingDiff;

    return a.recipe.name.localeCompare(b.recipe.name);
  });
}

/**
 * Validador atômico de preparação de receita.
 * Retorna o plano exato de débito ou erro bloqueante caso algum ingrediente falte.
 */
export function validateAtomicPreparation(
  recipe: Recipe,
  products: Product[],
  targetServings?: number
): {
  canExecute: boolean;
  error?: string;
  debits: {
    productId: string;
    productName: string;
    quantityInProductUnit: number;
    productUnit: ProductUnit;
    previousStock: number;
    newStock: number;
  }[];
} {
  const availability = calculateRecipeAvailability(recipe, products, targetServings);

  if (!availability.canPrepare) {
    const missing = availability.missingIngredientsList
      .filter(m => !m.isOptional)
      .map(m => `${m.name} (faltam ${formatUnitDisplay(m.deficit, m.unit)})`)
      .join(', ');
    return {
      canExecute: false,
      error: `Não é possível preparar a receita. Estoque insuficiente para: ${missing}.`,
      debits: [],
    };
  }

  const debits: {
    productId: string;
    productName: string;
    quantityInProductUnit: number;
    productUnit: ProductUnit;
    previousStock: number;
    newStock: number;
  }[] = [];

  for (const item of availability.ingredients) {
    if (!item.product) continue;
    // Se for opcional e não tiver estoque suficiente, não debita
    if (item.isOptional && item.status !== 'available') continue;

    const prev = roundPrecision(item.product.current_stock || 0, 3);
    const needed = roundPrecision(item.neededInStockUnit, 3);

    if (prev < needed) {
      return {
        canExecute: false,
        error: `Estoque insuficiente de última hora para ${item.productName}: disponível ${prev} ${item.product.unit}, necessário ${needed} ${item.product.unit}.`,
        debits: [],
      };
    }

    const next = clampNonNegative(roundPrecision(safeSub(prev, needed), 3));
    debits.push({
      productId: item.product.id,
      productName: item.product.name,
      quantityInProductUnit: needed,
      productUnit: item.product.unit,
      previousStock: prev,
      newStock: next,
    });
  }

  return {
    canExecute: true,
    debits,
  };
}
