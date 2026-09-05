import { FullHouseData } from '../services/api';

export const INITIAL_HOUSE_DATA: FullHouseData = {
  house: {
    id: "c0a80101-0000-4000-8000-000000000001",
    name: "Casa da Família",
    admin_id: "c0a80101-0000-4000-8000-000000000002",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-09-05T10:00:00Z",
    settings: {
      currency: "BRL",
      low_stock_days_threshold: 7,
      planning_days: 30
    }
  },
  members: [
    {
      id: "c0a80101-0000-4000-8000-000000000002",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Mãe (Administradora)",
      email: "mae@casacontrole.local",
      role: "admin",
      avatar_color: "#e11d48",
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "c0a80101-0000-4000-8000-000000000003",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Filho / Familiar",
      email: "filho@casacontrole.local",
      role: "member",
      avatar_color: "#ec4899",
      created_at: "2026-08-01T10:00:00Z"
    }
  ],
  categories: [
    {
      id: "cat-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Alimentação",
      icon: "Utensils",
      color: "#f43f5e",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Padaria",
      icon: "Croissant",
      color: "#d97706",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-3",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Bebidas",
      icon: "Coffee",
      color: "#2563eb",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-4",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Higiene pessoal",
      icon: "Sparkles",
      color: "#ec4899",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-5",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Limpeza",
      icon: "Droplet",
      color: "#0891b2",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-6",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Farmácia",
      icon: "HeartPulse",
      color: "#e11d48",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-7",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Descartáveis",
      icon: "Box",
      color: "#64748b",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-8",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Animais",
      icon: "PawPrint",
      color: "#ca8a04",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "cat-9",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Outros",
      icon: "MoreHorizontal",
      color: "#475569",
      is_default: true,
      created_at: "2026-08-01T10:00:00Z"
    }
  ],
  products: [
    {
      id: "prod-arroz",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Arroz Branco",
      unit: "kg",
      current_stock: 6,
      min_stock_alert: 3,
      notes: "Consumo familiar regular. Marca Tipo 1.",
      last_purchase_price: 28.5,
      last_purchase_date: "2026-08-15",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-feijao",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Feijão Carioca",
      unit: "kg",
      current_stock: 1,
      min_stock_alert: 2,
      notes: "Feijão novo pacote 1kg.",
      last_purchase_price: 7.9,
      last_purchase_date: "2026-08-15",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-leite",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-3",
      name: "Leite Integral",
      unit: "L",
      current_stock: 10,
      min_stock_alert: 4,
      notes: "Caixas de 1L.",
      last_purchase_price: 4.89,
      last_purchase_date: "2026-09-01",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-pao",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-2",
      name: "Pão Francês",
      unit: "unidade",
      current_stock: 2,
      min_stock_alert: 6,
      notes: "Consumo diário matinal.",
      last_purchase_price: 0.9,
      last_purchase_date: "2026-09-04",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-papel",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-4",
      name: "Papel Higiênico (Folha Dupla)",
      unit: "rolo",
      current_stock: 16,
      min_stock_alert: 6,
      notes: "Pacote com 16 rolos.",
      last_purchase_price: 24.9,
      last_purchase_date: "2026-08-20",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-sabonete",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-4",
      name: "Sabonete em Barra",
      unit: "unidade",
      current_stock: 4,
      min_stock_alert: 3,
      notes: "Neutro ou suave.",
      last_purchase_price: 2.8,
      last_purchase_date: "2026-08-20",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-detergente",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-5",
      name: "Detergente Líquido",
      unit: "unidade",
      current_stock: 1,
      min_stock_alert: 2,
      notes: "Frasco 500ml.",
      last_purchase_price: 2.45,
      last_purchase_date: "2026-08-15",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-racao",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-8",
      name: "Ração para Cães",
      unit: "kg",
      current_stock: 12,
      min_stock_alert: 5,
      notes: "Saco de 15kg.",
      last_purchase_price: 135,
      last_purchase_date: "2026-08-10",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    }
  ],
  stockMovements: [
    {
      id: "mov-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      type: "addition",
      quantity_delta: 8,
      previous_stock: 0,
      new_stock: 8,
      reason: "Estoque inicial cadastrado",
      performed_by_member_id: "c0a80101-0000-4000-8000-000000000002",
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "mov-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      type: "consumption",
      quantity_delta: -2,
      previous_stock: 8,
      new_stock: 6,
      reason: "Consumo familiar de 2 kg em 05/09/2026",
      performed_by_member_id: "c0a80101-0000-4000-8000-000000000002",
      created_at: "2026-09-05T12:00:00Z"
    }
  ],
  consumptions: [
    {
      id: "c-arroz-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      quantity: 2.5,
      unit: "kg",
      date: "2026-08-08",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Consumo da semana",
      created_at: "2026-08-08T18:00:00Z"
    },
    {
      id: "c-arroz-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      quantity: 2.5,
      unit: "kg",
      date: "2026-08-22",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Consumo quinzenal",
      created_at: "2026-08-22T18:00:00Z"
    },
    {
      id: "c-arroz-3",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      quantity: 2,
      unit: "kg",
      date: "2026-09-05",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Consumo registrado hoje (exemplo da família)",
      created_at: "2026-09-05T12:00:00Z"
    },
    {
      id: "c-feijao-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-feijao",
      quantity: 1.5,
      unit: "kg",
      date: "2026-08-12",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Preparo da semana",
      created_at: "2026-08-12T18:00:00Z"
    },
    {
      id: "c-feijao-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-feijao",
      quantity: 1,
      unit: "kg",
      date: "2026-08-28",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Preparo semanal",
      created_at: "2026-08-28T18:00:00Z"
    },
    {
      id: "c-leite-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-leite",
      quantity: 6,
      unit: "L",
      date: "2026-08-25",
      member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Semana de café da manhã",
      created_at: "2026-08-25T18:00:00Z"
    }
  ],
  purchases: [
    {
      id: "pur-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      date: "2026-08-15",
      store_name: "Supermercado Bom Preço",
      total_amount: 198.4,
      buyer_member_id: "c0a80101-0000-4000-8000-000000000002",
      notes: "Compra do meio do mês",
      created_at: "2026-08-15T16:00:00Z"
    },
    {
      id: "pur-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      date: "2026-09-01",
      store_name: "Atacadão da Cidade",
      total_amount: 148.9,
      buyer_member_id: "c0a80101-0000-4000-8000-000000000003",
      notes: "Reposição de leite e itens de padaria",
      created_at: "2026-09-01T17:30:00Z"
    }
  ],
  purchaseItems: [
    {
      id: "pi-1",
      purchase_id: "pur-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      quantity: 5,
      unit: "kg",
      unit_price: 5.7,
      total_price: 28.5,
      notes: "Pacote 5kg",
      created_at: "2026-08-15T16:00:00Z"
    },
    {
      id: "pi-2",
      purchase_id: "pur-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-feijao",
      quantity: 2,
      unit: "kg",
      unit_price: 7.9,
      total_price: 15.8,
      notes: "2 pacotes de 1kg",
      created_at: "2026-08-15T16:00:00Z"
    },
    {
      id: "pi-3",
      purchase_id: "pur-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-leite",
      quantity: 12,
      unit: "L",
      unit_price: 4.89,
      total_price: 58.68,
      notes: "Caixa fechada com 12L",
      created_at: "2026-09-01T17:30:00Z"
    }
  ],
  priceHistory: [
    {
      id: "ph-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-arroz",
      unit_price: 5.7,
      store_name: "Supermercado Bom Preço",
      date: "2026-08-15",
      purchase_id: "pur-1",
      created_at: "2026-08-15T16:00:00Z"
    },
    {
      id: "ph-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-feijao",
      unit_price: 7.9,
      store_name: "Supermercado Bom Preço",
      date: "2026-08-15",
      purchase_id: "pur-1",
      created_at: "2026-08-15T16:00:00Z"
    },
    {
      id: "ph-3",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      product_id: "prod-leite",
      unit_price: 4.89,
      store_name: "Atacadão da Cidade",
      date: "2026-09-01",
      purchase_id: "pur-2",
      created_at: "2026-09-01T17:30:00Z"
    }
  ]
};
