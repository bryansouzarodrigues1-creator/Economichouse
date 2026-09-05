export interface ManualShoppingItem {
  id: string;
  houseId: string;
  name: string;
  productId?: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  icon?: string;
  addedAt: string;
  source: 'catalog' | 'manual' | 'recipe';
  estimatedPrice?: number;
  notes?: string;
}

const STORAGE_KEY = 'marketbuy_shopping_list_items';

export function getStoredShoppingItems(houseId: string): ManualShoppingItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${houseId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler lista de compras persistente:', err);
    return [];
  }
}

export function saveStoredShoppingItems(houseId: string, items: ManualShoppingItem[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${houseId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar lista de compras persistente:', err);
  }
}

export function addShoppingItem(
  houseId: string, 
  item: Omit<ManualShoppingItem, 'id' | 'houseId' | 'addedAt'>
): ManualShoppingItem {
  const current = getStoredShoppingItems(houseId);
  // Se já existir item com mesmo nome ou productId, incrementa quantidade
  const existingIndex = current.findIndex(
    i => (item.productId && i.productId === item.productId) || i.name.toLowerCase() === item.name.toLowerCase()
  );

  let newItem: ManualShoppingItem;
  if (existingIndex >= 0) {
    current[existingIndex].quantity = Number(current[existingIndex].quantity) + Number(item.quantity || 1);
    newItem = current[existingIndex];
  } else {
    newItem = {
      ...item,
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      houseId,
      addedAt: new Date().toISOString(),
    };
    current.unshift(newItem);
  }

  saveStoredShoppingItems(houseId, current);
  return newItem;
}

export function removeShoppingItem(houseId: string, itemId: string): void {
  const current = getStoredShoppingItems(houseId);
  const filtered = current.filter(i => i.id !== itemId);
  saveStoredShoppingItems(houseId, filtered);
}

export function clearAllShoppingItems(houseId: string): void {
  saveStoredShoppingItems(houseId, []);
}
