import fs from 'fs';
import path from 'path';
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
} from '../src/types';

export interface DatabaseData {
  houses: House[];
  members: UserMember[];
  categories: Category[];
  products: Product[];
  stockMovements: StockMovement[];
  consumptions: Consumption[];
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  priceHistory: PriceHistory[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'casacontrole-db.json');

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createInitialSeedData(): DatabaseData {
  const houseId = 'c0a80101-0000-4000-8000-000000000001';
  const momId = 'c0a80101-0000-4000-8000-000000000002';
  const sonId = 'c0a80101-0000-4000-8000-000000000003';

  const defaultHouse: House = {
    id: houseId,
    name: 'Casa da Família',
    admin_id: momId,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-09-05T10:00:00Z',
    settings: {
      currency: 'BRL',
      low_stock_days_threshold: 7,
      planning_days: 30,
    },
  };

  const initialMembers: UserMember[] = [
    {
      id: momId,
      house_id: houseId,
      name: 'Mãe (Administradora)',
      email: 'mae@casacontrole.local',
      role: 'admin',
      avatar_color: '#166534', // Verde escuro acolhedor
      created_at: '2026-08-01T10:00:00Z',
    },
    {
      id: sonId,
      house_id: houseId,
      name: 'Filho / Familiar',
      email: 'filho@casacontrole.local',
      role: 'member',
      avatar_color: '#1d4ed8', // Azul familiar
      created_at: '2026-08-01T10:00:00Z',
    },
  ];

  const categoryNames = [
    { name: 'Alimentação', icon: 'Utensils', color: '#059669' },
    { name: 'Padaria', icon: 'Croissant', color: '#d97706' },
    { name: 'Bebidas', icon: 'Coffee', color: '#2563eb' },
    { name: 'Higiene pessoal', icon: 'Sparkles', color: '#7c3aed' },
    { name: 'Limpeza', icon: 'Droplet', color: '#0891b2' },
    { name: 'Farmácia', icon: 'HeartPulse', color: '#e11d48' },
    { name: 'Descartáveis', icon: 'Box', color: '#64748b' },
    { name: 'Animais', icon: 'PawPrint', color: '#ca8a04' },
    { name: 'Outros', icon: 'MoreHorizontal', color: '#475569' },
  ];

  const categories: Category[] = categoryNames.map((cat, idx) => ({
    id: `cat-${idx + 1}`,
    house_id: houseId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    is_default: true,
    created_at: '2026-08-01T10:00:00Z',
  }));

  const catAlim = categories.find(c => c.name === 'Alimentação')!.id;
  const catPadaria = categories.find(c => c.name === 'Padaria')!.id;
  const catBebidas = categories.find(c => c.name === 'Bebidas')!.id;
  const catHigiene = categories.find(c => c.name === 'Higiene pessoal')!.id;
  const catLimpeza = categories.find(c => c.name === 'Limpeza')!.id;
  const catAnimais = categories.find(c => c.name === 'Animais')!.id;

  // Produtos iniciais com o caso citado pelo usuário:
  // "A família registra que consome aproximadamente 7 kg de arroz por mês.
  // Se atualmente existem 8 kg de arroz em casa, o sistema deve entender que não é necessário comprar mais arroz naquele momento."
  const products: Product[] = [
    {
      id: 'prod-arroz',
      house_id: houseId,
      category_id: catAlim,
      name: 'Arroz Branco',
      unit: 'kg',
      current_stock: 6, // Anteriormente 8kg, após 2kg consumidos -> 6kg restantes
      min_stock_alert: 3,
      notes: 'Consumo familiar regular. Marca Tipo 1.',
      last_purchase_price: 28.50, // pacote 5kg
      last_purchase_date: '2026-08-15',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-feijao',
      house_id: houseId,
      category_id: catAlim,
      name: 'Feijão Carioca',
      unit: 'kg',
      current_stock: 1, // Estoque baixo! Consome 3kg por mês -> Precisa comprar
      min_stock_alert: 2,
      notes: 'Feijão novo pacote 1kg.',
      last_purchase_price: 7.90,
      last_purchase_date: '2026-08-15',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-leite',
      house_id: houseId,
      category_id: catBebidas,
      name: 'Leite Integral',
      unit: 'L',
      current_stock: 10,
      min_stock_alert: 4,
      notes: 'Caixas de 1L.',
      last_purchase_price: 4.89,
      last_purchase_date: '2026-09-01',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-pao',
      house_id: houseId,
      category_id: catPadaria,
      name: 'Pão Francês',
      unit: 'unidade',
      current_stock: 2,
      min_stock_alert: 6,
      notes: 'Consumo diário matinal.',
      last_purchase_price: 0.90,
      last_purchase_date: '2026-09-04',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-papel',
      house_id: houseId,
      category_id: catHigiene,
      name: 'Papel Higiênico (Folha Dupla)',
      unit: 'rolo',
      current_stock: 16,
      min_stock_alert: 6,
      notes: 'Pacote com 16 rolos.',
      last_purchase_price: 24.90,
      last_purchase_date: '2026-08-20',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-sabonete',
      house_id: houseId,
      category_id: catHigiene,
      name: 'Sabonete em Barra',
      unit: 'unidade',
      current_stock: 4,
      min_stock_alert: 3,
      notes: 'Neutro ou suave.',
      last_purchase_price: 2.80,
      last_purchase_date: '2026-08-20',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-detergente',
      house_id: houseId,
      category_id: catLimpeza,
      name: 'Detergente Líquido',
      unit: 'unidade',
      current_stock: 1,
      min_stock_alert: 2,
      notes: 'Frasco 500ml.',
      last_purchase_price: 2.45,
      last_purchase_date: '2026-08-15',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-racao',
      house_id: houseId,
      category_id: catAnimais,
      name: 'Ração para Cães',
      unit: 'kg',
      current_stock: 12,
      min_stock_alert: 5,
      notes: 'Saco de 15kg.',
      last_purchase_price: 135.00,
      last_purchase_date: '2026-08-10',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
  ];

  // Histórico de consumo real para demonstrar cálculos determinísticos
  const consumptions: Consumption[] = [
    // Arroz: registros ao longo do mês mostrando consumo médio de ~7kg/mês
    {
      id: 'c-arroz-1',
      house_id: houseId,
      product_id: 'prod-arroz',
      quantity: 2.5,
      unit: 'kg',
      date: '2026-08-08',
      member_id: momId,
      notes: 'Consumo da semana',
      created_at: '2026-08-08T18:00:00Z',
    },
    {
      id: 'c-arroz-2',
      house_id: houseId,
      product_id: 'prod-arroz',
      quantity: 2.5,
      unit: 'kg',
      date: '2026-08-22',
      member_id: momId,
      notes: 'Consumo quinzenal',
      created_at: '2026-08-22T18:00:00Z',
    },
    {
      id: 'c-arroz-3',
      house_id: houseId,
      product_id: 'prod-arroz',
      quantity: 2.0,
      unit: 'kg',
      date: '2026-09-05',
      member_id: momId,
      notes: 'Consumo registrado hoje (exemplo da mãe)',
      created_at: '2026-09-05T12:00:00Z',
    },
    // Feijão: consumiu 1.5kg em agosto e 1kg no início de setembro
    {
      id: 'c-feijao-1',
      house_id: houseId,
      product_id: 'prod-feijao',
      quantity: 1.5,
      unit: 'kg',
      date: '2026-08-12',
      member_id: momId,
      notes: 'Preparo da semana',
      created_at: '2026-08-12T18:00:00Z',
    },
    {
      id: 'c-feijao-2',
      house_id: houseId,
      product_id: 'prod-feijao',
      quantity: 1.0,
      unit: 'kg',
      date: '2026-08-28',
      member_id: momId,
      notes: 'Preparo semanal',
      created_at: '2026-08-28T18:00:00Z',
    },
    // Leite
    {
      id: 'c-leite-1',
      house_id: houseId,
      product_id: 'prod-leite',
      quantity: 6,
      unit: 'L',
      date: '2026-08-25',
      member_id: momId,
      notes: 'Semana de café da manhã',
      created_at: '2026-08-25T18:00:00Z',
    },
  ];

  // Movimentações de estoque registradas
  const stockMovements: StockMovement[] = [
    {
      id: 'mov-1',
      house_id: houseId,
      product_id: 'prod-arroz',
      type: 'addition',
      quantity_delta: 8,
      previous_stock: 0,
      new_stock: 8,
      reason: 'Estoque inicial cadastrado',
      performed_by_member_id: momId,
      created_at: '2026-08-01T10:00:00Z',
    },
    {
      id: 'mov-2',
      house_id: houseId,
      product_id: 'prod-arroz',
      type: 'consumption',
      quantity_delta: -2,
      previous_stock: 8,
      new_stock: 6,
      reason: 'Consumo familiar de 2 kg em 05/09/2026',
      performed_by_member_id: momId,
      created_at: '2026-09-05T12:00:00Z',
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 'pur-1',
      house_id: houseId,
      date: '2026-08-15',
      store_name: 'Supermercado Bom Preço',
      total_amount: 198.40,
      buyer_member_id: momId,
      notes: 'Compra do meio do mês',
      created_at: '2026-08-15T16:00:00Z',
    },
    {
      id: 'pur-2',
      house_id: houseId,
      date: '2026-09-01',
      store_name: 'Atacadão da Cidade',
      total_amount: 148.90,
      buyer_member_id: sonId,
      notes: 'Reposição de leite e itens de padaria',
      created_at: '2026-09-01T17:30:00Z',
    },
  ];

  const purchaseItems: PurchaseItem[] = [
    {
      id: 'pi-1',
      purchase_id: 'pur-1',
      house_id: houseId,
      product_id: 'prod-arroz',
      quantity: 5,
      unit: 'kg',
      unit_price: 5.70,
      total_price: 28.50,
      notes: 'Pacote 5kg',
      created_at: '2026-08-15T16:00:00Z',
    },
    {
      id: 'pi-2',
      purchase_id: 'pur-1',
      house_id: houseId,
      product_id: 'prod-feijao',
      quantity: 2,
      unit: 'kg',
      unit_price: 7.90,
      total_price: 15.80,
      notes: '2 pacotes de 1kg',
      created_at: '2026-08-15T16:00:00Z',
    },
    {
      id: 'pi-3',
      purchase_id: 'pur-2',
      house_id: houseId,
      product_id: 'prod-leite',
      quantity: 12,
      unit: 'L',
      unit_price: 4.89,
      total_price: 58.68,
      notes: 'Caixa fechada com 12L',
      created_at: '2026-09-01T17:30:00Z',
    },
  ];

  const priceHistory: PriceHistory[] = [
    {
      id: 'ph-1',
      house_id: houseId,
      product_id: 'prod-arroz',
      unit_price: 5.70,
      store_name: 'Supermercado Bom Preço',
      date: '2026-08-15',
      purchase_id: 'pur-1',
      created_at: '2026-08-15T16:00:00Z',
    },
    {
      id: 'ph-2',
      house_id: houseId,
      product_id: 'prod-feijao',
      unit_price: 7.90,
      store_name: 'Supermercado Bom Preço',
      date: '2026-08-15',
      purchase_id: 'pur-1',
      created_at: '2026-08-15T16:00:00Z',
    },
    {
      id: 'ph-3',
      house_id: houseId,
      product_id: 'prod-leite',
      unit_price: 4.89,
      store_name: 'Atacadão da Cidade',
      date: '2026-09-01',
      purchase_id: 'pur-2',
      created_at: '2026-09-01T17:30:00Z',
    },
  ];

  return {
    houses: [defaultHouse],
    members: initialMembers,
    categories,
    products,
    stockMovements,
    consumptions,
    purchases,
    purchaseItems,
    priceHistory,
  };
}

export class JsonDatabase {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Erro ao ler banco de dados local, recriando seed:', err);
    }

    const seed = createInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DatabaseData) {
    try {
      ensureDirectoryExistence(DB_FILE);
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;
    } catch (err) {
      console.error('Erro ao salvar banco de dados local:', err);
    }
  }

  // Getters
  public getHouseData(houseId: string) {
    const house = this.data.houses.find(h => h.id === houseId) || this.data.houses[0];
    if (!house) return null;

    const actualHouseId = house.id;
    return {
      house,
      members: this.data.members.filter(m => m.house_id === actualHouseId),
      categories: this.data.categories.filter(c => c.house_id === actualHouseId),
      products: this.data.products.filter(p => p.house_id === actualHouseId),
      stockMovements: this.data.stockMovements.filter(sm => sm.house_id === actualHouseId),
      consumptions: this.data.consumptions.filter(c => c.house_id === actualHouseId),
      purchases: this.data.purchases.filter(p => p.house_id === actualHouseId),
      purchaseItems: this.data.purchaseItems.filter(pi => pi.house_id === actualHouseId),
      priceHistory: this.data.priceHistory.filter(ph => ph.house_id === actualHouseId),
    };
  }

  public getHouses(): House[] {
    return this.data.houses;
  }

  // Product CRUD
  public addProduct(houseId: string, item: Omit<Product, 'id' | 'house_id' | 'created_at' | 'updated_at'>): Product {
    const now = new Date().toISOString();
    const product: Product = {
      ...item,
      id: generateUUID(),
      house_id: houseId,
      current_stock: Number(item.current_stock || 0),
      min_stock_alert: item.min_stock_alert !== undefined ? Number(item.min_stock_alert) : 0,
      created_at: now,
      updated_at: now,
    };

    this.data.products.push(product);

    // Registra movimento inicial se estoque > 0
    if (product.current_stock > 0) {
      this.data.stockMovements.push({
        id: generateUUID(),
        house_id: houseId,
        product_id: product.id,
        type: 'addition',
        quantity_delta: product.current_stock,
        previous_stock: 0,
        new_stock: product.current_stock,
        reason: 'Estoque inicial no cadastro do produto',
        created_at: now,
      });
    }

    this.saveData(this.data);
    return product;
  }

  public updateProduct(houseId: string, productId: string, item: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === productId && p.house_id === houseId);
    if (idx === -1) return null;

    const existing = this.data.products[idx];
    const updated: Product = {
      ...existing,
      ...item,
      updated_at: new Date().toISOString(),
    };

    this.data.products[idx] = updated;
    this.saveData(this.data);
    return updated;
  }

  public deleteProduct(houseId: string, productId: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => !(p.id === productId && p.house_id === houseId));
    if (this.data.products.length < initialLen) {
      // Limpa dados associados
      this.data.consumptions = this.data.consumptions.filter(c => c.product_id !== productId);
      this.data.stockMovements = this.data.stockMovements.filter(sm => sm.product_id !== productId);
      this.data.purchaseItems = this.data.purchaseItems.filter(pi => pi.product_id !== productId);
      this.data.priceHistory = this.data.priceHistory.filter(ph => ph.product_id !== productId);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Registrar Consumo
  public recordConsumption(
    houseId: string, 
    productId: string, 
    quantity: number, 
    date: string, 
    memberId?: string, 
    notes?: string
  ): { consumption: Consumption; movement: StockMovement; updatedProduct: Product } {
    const product = this.data.products.find(p => p.id === productId && p.house_id === houseId);
    if (!product) throw new Error('Produto não encontrado');

    const qty = Number(quantity);
    const prevStock = Number(product.current_stock);
    const newStock = Math.max(0, prevStock - qty);
    const now = new Date().toISOString();

    // 1. Atualizar produto
    product.current_stock = newStock;
    product.updated_at = now;

    // 2. Criar consumo
    const consumption: Consumption = {
      id: generateUUID(),
      house_id: houseId,
      product_id: productId,
      quantity: qty,
      unit: product.unit,
      date: date || new Date().toISOString().split('T')[0],
      member_id: memberId,
      notes: notes || 'Consumo doméstico',
      created_at: now,
    };
    this.data.consumptions.push(consumption);

    // 3. Criar movimentação de estoque
    const movement: StockMovement = {
      id: generateUUID(),
      house_id: houseId,
      product_id: productId,
      type: 'consumption',
      quantity_delta: -qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: notes || `Consumo de ${qty} ${product.unit}`,
      performed_by_member_id: memberId,
      created_at: now,
    };
    this.data.stockMovements.push(movement);

    this.saveData(this.data);
    return { consumption, movement, updatedProduct: product };
  }

  // Registrar Ajuste de Estoque
  public adjustStock(
    houseId: string, 
    productId: string, 
    newStockValue: number, 
    type: 'manual_adjustment' | 'addition' | 'removal', 
    reason?: string,
    memberId?: string
  ): { movement: StockMovement; updatedProduct: Product } {
    const product = this.data.products.find(p => p.id === productId && p.house_id === houseId);
    if (!product) throw new Error('Produto não encontrado');

    const prevStock = Number(product.current_stock);
    const targetStock = Math.max(0, Number(newStockValue));
    const delta = targetStock - prevStock;
    const now = new Date().toISOString();

    product.current_stock = targetStock;
    product.updated_at = now;

    const movement: StockMovement = {
      id: generateUUID(),
      house_id: houseId,
      product_id: productId,
      type,
      quantity_delta: delta,
      previous_stock: prevStock,
      new_stock: targetStock,
      reason: reason || 'Ajuste manual de estoque',
      performed_by_member_id: memberId,
      created_at: now,
    };
    this.data.stockMovements.push(movement);

    this.saveData(this.data);
    return { movement, updatedProduct: product };
  }

  // Registrar Compra
  public recordPurchase(
    houseId: string,
    data: {
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
  ): { purchase: Purchase; items: PurchaseItem[] } {
    const now = new Date().toISOString();
    const purchaseId = generateUUID();
    let totalAmount = 0;
    const createdItems: PurchaseItem[] = [];

    for (const item of data.items) {
      const product = this.data.products.find(p => p.id === item.product_id && p.house_id === houseId);
      if (!product) continue;

      const qty = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const itemTotal = qty * unitPrice;
      totalAmount += itemTotal;

      const prevStock = Number(product.current_stock);
      const newStock = prevStock + qty;

      // Atualiza produto
      product.current_stock = newStock;
      product.last_purchase_price = unitPrice;
      product.last_purchase_date = data.date;
      product.updated_at = now;

      // Item da compra
      const pItem: PurchaseItem = {
        id: generateUUID(),
        purchase_id: purchaseId,
        house_id: houseId,
        product_id: item.product_id,
        quantity: qty,
        unit: product.unit,
        unit_price: unitPrice,
        total_price: itemTotal,
        notes: item.notes,
        created_at: now,
      };
      this.data.purchaseItems.push(pItem);
      createdItems.push(pItem);

      // Movimentação de estoque
      this.data.stockMovements.push({
        id: generateUUID(),
        house_id: houseId,
        product_id: item.product_id,
        type: 'purchase',
        quantity_delta: qty,
        previous_stock: prevStock,
        new_stock: newStock,
        reason: `Compra em ${data.store_name || 'mercado'}`,
        performed_by_member_id: data.buyer_member_id,
        created_at: now,
      });

      // Histórico de preço
      this.data.priceHistory.push({
        id: generateUUID(),
        house_id: houseId,
        product_id: item.product_id,
        unit_price: unitPrice,
        store_name: data.store_name,
        date: data.date,
        purchase_id: purchaseId,
        created_at: now,
      });
    }

    const purchase: Purchase = {
      id: purchaseId,
      house_id: houseId,
      date: data.date,
      store_name: data.store_name,
      total_amount: totalAmount,
      buyer_member_id: data.buyer_member_id,
      notes: data.notes,
      items: createdItems,
      created_at: now,
    };
    this.data.purchases.push(purchase);

    this.saveData(this.data);
    return { purchase, items: createdItems };
  }

  // Categories
  public addCategory(houseId: string, name: string, icon = 'Layers', color = '#059669'): Category {
    const category: Category = {
      id: generateUUID(),
      house_id: houseId,
      name,
      icon,
      color,
      is_default: false,
      created_at: new Date().toISOString(),
    };
    this.data.categories.push(category);
    this.saveData(this.data);
    return category;
  }

  // Members
  public addMember(houseId: string, name: string, email?: string, role: 'admin' | 'member' = 'member', avatarColor = '#166534'): UserMember {
    const member: UserMember = {
      id: generateUUID(),
      house_id: houseId,
      name,
      email,
      role,
      avatar_color: avatarColor,
      created_at: new Date().toISOString(),
    };
    this.data.members.push(member);
    this.saveData(this.data);
    return member;
  }

  // House Settings
  public updateSettings(houseId: string, settings: Partial<House['settings']>): House | null {
    const house = this.data.houses.find(h => h.id === houseId);
    if (!house) return null;

    house.settings = { ...house.settings, ...settings };
    house.updated_at = new Date().toISOString();
    this.saveData(this.data);
    return house;
  }
}

export const db = new JsonDatabase();
