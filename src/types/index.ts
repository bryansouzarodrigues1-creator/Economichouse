/**
 * CasaControle - Modelos de Dados Compatíveis com Supabase / PostgreSQL
 */

export type Role = 'admin' | 'member';

export interface House {
  id: string; // UUID
  name: string;
  admin_id: string;
  created_at: string;
  updated_at: string;
  settings: HouseSettings;
}

export interface HouseSettings {
  currency: string; // ex: 'BRL'
  low_stock_days_threshold: number; // ex: 7 dias
  planning_days: number; // ex: 30 dias para estimativa mensal
}

export interface UserMember {
  id: string; // UUID
  house_id: string;
  name: string;
  email?: string;
  role: Role;
  avatar_color: string;
  created_at: string;
}

export interface Category {
  id: string; // UUID
  house_id: string;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  created_at: string;
}

export type ProductUnit = 
  | 'kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'unidade'
  | 'pacote'
  | 'caixa'
  | 'rolo'
  | 'dúzia'
  | 'bandeja'
  | string;

export interface Product {
  id: string; // UUID
  house_id: string;
  category_id: string;
  name: string;
  unit: ProductUnit;
  current_stock: number;
  min_stock_alert?: number;
  notes?: string;
  last_purchase_price?: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export type StockMovementType = 
  | 'purchase'           // Adicionado via compra
  | 'consumption'        // Retirado via consumo
  | 'addition'           // Adição avulsa
  | 'removal'            // Retirada avulsa
  | 'manual_adjustment'; // Correção de inventário

export interface StockMovement {
  id: string; // UUID
  house_id: string;
  product_id: string;
  type: StockMovementType;
  quantity_delta: number; // positivo ou negativo
  previous_stock: number;
  new_stock: number;
  reason?: string;
  performed_by_member_id?: string;
  created_at: string;
}

export interface Consumption {
  id: string; // UUID
  house_id: string;
  product_id: string;
  quantity: number;
  unit: ProductUnit;
  date: string; // YYYY-MM-DD
  member_id?: string;
  notes?: string;
  created_at: string;
}

export interface Purchase {
  id: string; // UUID
  house_id: string;
  date: string; // YYYY-MM-DD
  store_name?: string;
  total_amount: number;
  buyer_member_id?: string;
  notes?: string;
  items?: PurchaseItem[];
  created_at: string;
}

export interface PurchaseItem {
  id: string; // UUID
  purchase_id: string;
  house_id: string;
  product_id: string;
  quantity: number;
  unit: ProductUnit;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface PriceHistory {
  id: string; // UUID
  house_id: string;
  product_id: string;
  unit_price: number;
  store_name?: string;
  date: string; // YYYY-MM-DD
  purchase_id?: string;
  created_at: string;
}

// -------------------------------------------------------------
// Cálculos Determinísticos e Previsões (Regras de Negócio)
// -------------------------------------------------------------

export type PurchaseRecommendationStatus = 'buy_now' | 'buy_soon' | 'dont_buy';

export interface ProductCalculations {
  productId: string;
  totalConsumed: number;
  recordsCount: number;
  firstRecordDate?: string;
  lastRecordDate?: string;
  daysOfHistory: number;
  hasSufficientHistory: boolean;
  historyStatusMessage: string;
  avgDailyConsumption: number;
  avgWeeklyConsumption: number;
  avgMonthlyConsumption: number;
  daysOfStockEstimated: number | null; // null se consumo = 0 ou histórico insuficiente
  consumptionTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  recommendation: {
    status: PurchaseRecommendationStatus;
    statusLabel: string; // 'Comprar', 'Comprar em breve', 'Não comprar'
    color: 'red' | 'amber' | 'emerald';
    suggestedQuantity: number;
    explanation: string;
  };
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockCount: number;
  sufficientStockCount: number;
  buyNowCount: number;
  buySoonCount: number;
  monthExpenses: number;
  previousMonthExpenses: number;
  expensesDiffPercentage: number;
  monthConsumptionCount: number;
  topSpendingCategories: {
    categoryId: string;
    categoryName: string;
    color?: string;
    totalAmount: number;
    percentage: number;
  }[];
}
