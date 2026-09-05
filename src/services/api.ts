import { 
  House, 
  UserMember, 
  Category, 
  Product, 
  StockMovement, 
  Consumption, 
  Purchase, 
  PurchaseItem, 
  PriceHistory 
} from '../types';
import { INITIAL_HOUSE_DATA } from '../data/initialData';

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

  const previousStock = product.current_stock;
  const newStock = Math.max(0, previousStock - payload.quantity);
  product.current_stock = newStock;
  product.updated_at = new Date().toISOString();

  const newConsumption: Consumption = {
    id: generateId('c'),
    house_id: houseId,
    product_id: payload.productId,
    quantity: payload.quantity,
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
    quantity_delta: -payload.quantity,
    previous_stock: previousStock,
    new_stock: newStock,
    reason: payload.notes || `Consumo de ${payload.quantity} ${product.unit}`,
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

  const previousStock = product.current_stock;
  const newStock = Math.max(0, payload.newStockValue);
  const delta = newStock - previousStock;
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

    const itemTotal = item.quantity * item.unit_price;
    totalAmount += itemTotal;

    const purchaseItem: PurchaseItem = {
      id: generateId('pi'),
      purchase_id: purchaseId,
      house_id: houseId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit: product.unit,
      unit_price: item.unit_price,
      total_price: itemTotal,
      notes: item.notes,
      created_at: new Date().toISOString()
    };
    createdItems.push(purchaseItem);

    // Atualiza estoque e preço do produto
    const prevStock = product.current_stock;
    product.current_stock += item.quantity;
    product.last_purchase_price = item.unit_price;
    product.last_purchase_date = payload.date;
    product.updated_at = new Date().toISOString();

    // Histórico de preços
    const ph: PriceHistory = {
      id: generateId('ph'),
      house_id: houseId,
      product_id: item.product_id,
      unit_price: item.unit_price,
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
      type: 'addition',
      quantity_delta: item.quantity,
      previous_stock: prevStock,
      new_stock: product.current_stock,
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
  const newProduct: Product = {
    ...payload,
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
    current.products[index] = {
      ...current.products[index],
      ...payload,
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
