import { 
  House, 
  UserMember, 
  Category, 
  Product, 
  StockMovement, 
  Consumption, 
  Purchase, 
  PurchaseItem, 
  PriceHistory,
  Recipe,
  RecipeIngredient 
} from '../types';
import { INITIAL_HOUSE_DATA, DEMO_HOUSE_DATA, EMPTY_HOUSE_DATA } from '../data/initialData';
import { roundPrecision, safeAdd, safeSub, safeMul, clampNonNegative } from '../utils/math';
import { validateAtomicPreparation } from '../utils/recipeEngine';

export interface FullHouseData {
  house: House;
  members: UserMember[];
  categories: Category[];
  products: Product[];
  stockMovements: StockMovement[];
  consumptions: Consumption[];
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  priceHistory: PriceHistory[];
  recipes: Recipe[];
}

const LOCAL_STORAGE_KEY = 'casacontrole_cached_data';
const ACTIVE_HOUSE_KEY = 'casacontrole_active_house_id';

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export async function fetchHousesList(): Promise<House[]> {
  try {
    const res = await fetch('/api/houses');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Modo estático/offline (Netlify)
  }
  const cached = getCachedData();
  return [cached.house];
}

export function getStoredActiveHouseId(): string {
  return localStorage.getItem(ACTIVE_HOUSE_KEY) || 'c0a80101-0000-4000-8000-000000000001';
}

export function setStoredActiveHouseId(id: string) {
  localStorage.setItem(ACTIVE_HOUSE_KEY, id);
}

export function getCachedData(): FullHouseData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.house && Array.isArray(parsed.products)) {
        if (!Array.isArray(parsed.recipes)) {
          parsed.recipes = INITIAL_HOUSE_DATA.recipes || [];
        }
        return parsed;
      }
    }
  } catch {
    // Ignora erro de parse
  }
  // Se não houver nada no localStorage, inicializa com os dados padrão
  setCachedData(INITIAL_HOUSE_DATA);
  return INITIAL_HOUSE_DATA;
}

export function setCachedData(data: FullHouseData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Não foi possível salvar em cache local:', e);
  }
}

export async function fetchHouseData(houseId: string): Promise<FullHouseData> {
  try {
    const res = await fetch(`/api/houses/${houseId}/data`);
    if (res.ok) {
      const data: FullHouseData = await res.json();
      setCachedData(data);
      return data;
    }
  } catch (e) {
    // Modo estático / offline (ex: Netlify)
  }

  return getCachedData();
}

export async function apiRecordConsumption(
  houseId: string, 
  payload: { productId: string; quantity: number; date: string; memberId?: string; notes?: string }
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/consumptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local para Netlify
  }

  const current = getCachedData();
  const product = current.products.find(p => p.id === payload.productId);
  if (!product) throw new Error('Produto não encontrado');

  const previousStock = roundPrecision(product.current_stock || 0, 3);
  const qty = roundPrecision(payload.quantity || 0, 3);
  const newStock = clampNonNegative(safeSub(previousStock, qty));
  product.current_stock = newStock;
  product.updated_at = new Date().toISOString();

  const newConsumption: Consumption = {
    id: generateId('c'),
    house_id: houseId,
    product_id: payload.productId,
    quantity: qty,
    unit: product.unit,
    date: payload.date || new Date().toISOString().split('T')[0],
    member_id: payload.memberId,
    notes: payload.notes,
    created_at: new Date().toISOString()
  };

  const newMovement: StockMovement = {
    id: generateId('mov'),
    house_id: houseId,
    product_id: payload.productId,
    type: 'consumption',
    quantity_delta: roundPrecision(-qty, 3),
    previous_stock: previousStock,
    new_stock: newStock,
    reason: payload.notes || `Consumo de ${qty} ${product.unit}`,
    performed_by_member_id: payload.memberId,
    created_at: new Date().toISOString()
  };

  current.consumptions.unshift(newConsumption);
  current.stockMovements.unshift(newMovement);
  setCachedData(current);

  return { consumption: newConsumption, movement: newMovement, product };
}

export async function apiAdjustStock(
  houseId: string,
  payload: { productId: string; newStockValue: number; type?: string; reason?: string; memberId?: string }
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/stock-adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const product = current.products.find(p => p.id === payload.productId);
  if (!product) throw new Error('Produto não encontrado');

  const previousStock = roundPrecision(product.current_stock || 0, 3);
  const newStock = clampNonNegative(payload.newStockValue || 0);
  const delta = roundPrecision(safeSub(newStock, previousStock), 3);
  product.current_stock = newStock;
  product.updated_at = new Date().toISOString();

  const movement: StockMovement = {
    id: generateId('mov'),
    house_id: houseId,
    product_id: payload.productId,
    type: (payload.type as any) || 'adjustment',
    quantity_delta: delta,
    previous_stock: previousStock,
    new_stock: newStock,
    reason: payload.reason || 'Ajuste manual de estoque',
    performed_by_member_id: payload.memberId,
    created_at: new Date().toISOString()
  };

  current.stockMovements.unshift(movement);
  setCachedData(current);

  return { product, movement };
}

export async function apiRecordPurchase(
  houseId: string,
  payload: {
    date: string;
    store_name?: string;
    notes?: string;
    buyer_member_id?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      notes?: string;
    }[];
  }
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const purchaseId = generateId('pur');
  let totalAmount = 0;
  const createdItems: PurchaseItem[] = [];

  for (const item of payload.items) {
    const product = current.products.find(p => p.id === item.product_id);
    if (!product) continue;

    const qty = roundPrecision(item.quantity || 0, 3);
    const uPrice = roundPrecision(item.unit_price || 0, 2);
    const itemTotal = safeMul(qty, uPrice, 2);
    totalAmount = safeAdd(totalAmount, itemTotal, 2);

    const purchaseItem: PurchaseItem = {
      id: generateId('pi'),
      purchase_id: purchaseId,
      house_id: houseId,
      product_id: item.product_id,
      quantity: qty,
      unit: product.unit,
      unit_price: uPrice,
      total_price: itemTotal,
      notes: item.notes,
      created_at: new Date().toISOString()
    };
    createdItems.push(purchaseItem);

    // Atualiza estoque e preço do produto
    const prevStock = roundPrecision(product.current_stock || 0, 3);
    const newStock = roundPrecision(safeAdd(prevStock, qty), 3);
    product.current_stock = newStock;
    product.last_purchase_price = uPrice;
    product.last_purchase_date = payload.date;
    product.updated_at = new Date().toISOString();

    // Histórico de preços
    const ph: PriceHistory = {
      id: generateId('ph'),
      house_id: houseId,
      product_id: item.product_id,
      unit_price: uPrice,
      store_name: payload.store_name,
      date: payload.date,
      purchase_id: purchaseId,
      created_at: new Date().toISOString()
    };
    current.priceHistory.unshift(ph);

    // Movimentação
    const mov: StockMovement = {
      id: generateId('mov'),
      house_id: houseId,
      product_id: item.product_id,
      type: 'purchase',
      quantity_delta: qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: `Compra em ${payload.store_name || 'supermercado'}`,
      performed_by_member_id: payload.buyer_member_id,
      created_at: new Date().toISOString()
    };
    current.stockMovements.unshift(mov);
  }

  const newPurchase: Purchase = {
    id: purchaseId,
    house_id: houseId,
    date: payload.date,
    store_name: payload.store_name,
    total_amount: totalAmount,
    buyer_member_id: payload.buyer_member_id,
    notes: payload.notes,
    created_at: new Date().toISOString()
  };

  current.purchases.unshift(newPurchase);
  current.purchaseItems.unshift(...createdItems);
  setCachedData(current);

  return { purchase: newPurchase, items: createdItems };
}

export async function apiAddProduct(
  houseId: string,
  payload: Omit<Product, 'id' | 'house_id' | 'created_at' | 'updated_at'>
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const sanitizedStock = clampNonNegative(payload.current_stock || 0);
  const sanitizedMinAlert = payload.min_stock_alert !== undefined ? clampNonNegative(payload.min_stock_alert) : undefined;
  const newProduct: Product = {
    ...payload,
    current_stock: sanitizedStock,
    min_stock_alert: sanitizedMinAlert,
    id: generateId('prod'),
    house_id: houseId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  current.products.push(newProduct);
  setCachedData(current);
  return newProduct;
}

export async function apiUpdateProduct(
  houseId: string,
  productId: string,
  payload: Partial<Product>
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const index = current.products.findIndex(p => p.id === productId);
  if (index >= 0) {
    const updatedPayload = { ...payload };
    if (updatedPayload.current_stock !== undefined) {
      updatedPayload.current_stock = clampNonNegative(updatedPayload.current_stock);
    }
    if (updatedPayload.min_stock_alert !== undefined) {
      updatedPayload.min_stock_alert = clampNonNegative(updatedPayload.min_stock_alert);
    }
    current.products[index] = {
      ...current.products[index],
      ...updatedPayload,
      updated_at: new Date().toISOString()
    };
    setCachedData(current);
    return current.products[index];
  }
  throw new Error('Produto não encontrado');
}

export async function apiDeleteProduct(houseId: string, productId: string) {
  try {
    const res = await fetch(`/api/houses/${houseId}/products/${productId}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  current.products = current.products.filter(p => p.id !== productId);
  setCachedData(current);
  return { success: true };
}

export async function apiAddCategory(houseId: string, name: string, icon?: string, color?: string) {
  try {
    const res = await fetch(`/api/houses/${houseId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, color }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const newCategory: Category = {
    id: generateId('cat'),
    house_id: houseId,
    name,
    icon: icon || 'Box',
    color: color || '#f43f5e',
    is_default: false,
    created_at: new Date().toISOString()
  };
  current.categories.push(newCategory);
  setCachedData(current);
  return newCategory;
}

export async function apiAddMember(
  houseId: string, 
  payload: { name: string; email?: string; role: 'admin' | 'member'; avatarColor?: string }
) {
  try {
    const res = await fetch(`/api/houses/${houseId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const newMember: UserMember = {
    id: generateId('mem'),
    house_id: houseId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    avatar_color: payload.avatarColor || '#e11d48',
    created_at: new Date().toISOString()
  };
  current.members.push(newMember);
  setCachedData(current);
  return newMember;
}

export async function apiResetToDemoData(): Promise<FullHouseData> {
  setCachedData(DEMO_HOUSE_DATA);
  return DEMO_HOUSE_DATA;
}

export async function apiResetToEmptyData(): Promise<FullHouseData> {
  setCachedData(EMPTY_HOUSE_DATA);
  return EMPTY_HOUSE_DATA;
}

// -------------------------------------------------------------
// Operações do Módulo de Receitas
// -------------------------------------------------------------

export async function apiAddRecipe(
  houseId: string,
  payload: Omit<Recipe, 'id' | 'house_id' | 'created_at' | 'updated_at'>
): Promise<Recipe> {
  try {
    const res = await fetch(`/api/houses/${houseId}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  const newRecipe: Recipe = {
    ...payload,
    id: generateId('rec'),
    house_id: houseId,
    ingredients: (payload.ingredients || []).map(ing => ({
      ...ing,
      id: ing.id || generateId('ing')
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!current.recipes) current.recipes = [];
  current.recipes.unshift(newRecipe);
  setCachedData(current);
  return newRecipe;
}

export async function apiUpdateRecipe(
  houseId: string,
  recipeId: string,
  payload: Partial<Recipe>
): Promise<Recipe> {
  try {
    const res = await fetch(`/api/houses/${houseId}/recipes/${recipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  if (!current.recipes) current.recipes = [];
  const idx = current.recipes.findIndex(r => r.id === recipeId);
  if (idx === -1) throw new Error('Receita não encontrada');

  const updated: Recipe = {
    ...current.recipes[idx],
    ...payload,
    updated_at: new Date().toISOString()
  };

  current.recipes[idx] = updated;
  setCachedData(current);
  return updated;
}

export async function apiDeleteRecipe(houseId: string, recipeId: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/houses/${houseId}/recipes/${recipeId}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }

  const current = getCachedData();
  if (current.recipes) {
    current.recipes = current.recipes.filter(r => r.id !== recipeId);
    setCachedData(current);
  }
  return { success: true };
}

export async function apiPrepareRecipe(
  houseId: string,
  recipeId: string,
  servings: number,
  memberId?: string
): Promise<{ 
  success: boolean; 
  consumptions: Consumption[]; 
  movements: StockMovement[]; 
  message: string 
}> {
  try {
    const res = await fetch(`/api/houses/${houseId}/recipes/${recipeId}/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servings, memberId }),
    });
    if (res.ok) return await res.json();
    if (res.status === 400) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao preparar receita');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    // Fallback local caso endpoint não responda
  }

  const current = getCachedData();
  const recipe = current.recipes?.find(r => r.id === recipeId);
  if (!recipe) throw new Error('Receita não encontrada');

  // Validação atômica matemática determinística
  const validation = validateAtomicPreparation(recipe, current.products, servings);
  if (!validation.canExecute) {
    throw new Error(validation.error || 'Estoque insuficiente para preparar a receita.');
  }

  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const createdConsumptions: Consumption[] = [];
  const createdMovements: StockMovement[] = [];

  // Execução atômica do plano de débito
  for (const debit of validation.debits) {
    const product = current.products.find(p => p.id === debit.productId);
    if (!product) continue;

    // Atualiza estoque
    product.current_stock = debit.newStock;
    product.updated_at = now;

    // Cria registro de consumo com rastreabilidade
    const consumption: Consumption = {
      id: generateId('c'),
      house_id: houseId,
      product_id: product.id,
      quantity: debit.quantityInProductUnit,
      unit: debit.productUnit,
      date: today,
      member_id: memberId,
      notes: `Consumo através da receita: ${recipe.name} (${servings} porções)`,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      created_at: now
    };
    createdConsumptions.push(consumption);
    current.consumptions.unshift(consumption);

    // Cria movimentação de estoque com rastreabilidade
    const movement: StockMovement = {
      id: generateId('mov'),
      house_id: houseId,
      product_id: product.id,
      type: 'consumption',
      quantity_delta: roundPrecision(-debit.quantityInProductUnit, 3),
      previous_stock: debit.previousStock,
      new_stock: debit.newStock,
      reason: `Consumo através da receita: ${recipe.name}`,
      performed_by_member_id: memberId,
      recipe_id: recipe.id,
      created_at: now
    };
    createdMovements.push(movement);
    current.stockMovements.unshift(movement);
  }

  setCachedData(current);

  return {
    success: true,
    consumptions: createdConsumptions,
    movements: createdMovements,
    message: `Receita "${recipe.name}" preparada com sucesso! ${createdConsumptions.length} ingredientes consumidos no estoque.`
  };
}

