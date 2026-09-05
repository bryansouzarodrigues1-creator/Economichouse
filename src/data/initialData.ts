import { FullHouseData } from '../services/api';

export const DEMO_HOUSE_DATA: FullHouseData = {
  house: {
    id: "c0a80101-0000-4000-8000-000000000001",
    name: "Residência Principal",
    admin_id: "c0a80101-0000-4000-8000-000000000002",
    plan: "pro",
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
      name: "Mariana Silva",
      email: "mariana.silva@casacontrole.app",
      role: "owner",
      avatar_color: "#e11d48",
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "c0a80101-0000-4000-8000-000000000003",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Carlos Eduardo",
      email: "carlos.eduardo@casacontrole.app",
      role: "admin",
      avatar_color: "#1d4ed8",
      created_at: "2026-08-01T10:00:00Z"
    },
    {
      id: "c0a80101-0000-4000-8000-000000000004",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Beatriz Silva",
      email: "beatriz.silva@casacontrole.app",
      role: "member",
      avatar_color: "#0f766e",
      created_at: "2026-08-10T10:00:00Z"
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
    },
    {
      id: "prod-ovos",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Ovos de Galinha",
      unit: "unidade",
      current_stock: 6,
      min_stock_alert: 4,
      notes: "Cartela com ovos frescos.",
      last_purchase_price: 12.0,
      last_purchase_date: "2026-09-02",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-cebola",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Cebola Nacional",
      unit: "kg",
      current_stock: 1.0,
      min_stock_alert: 0.5,
      notes: "Cebola para tempero.",
      last_purchase_price: 5.5,
      last_purchase_date: "2026-09-01",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-farinha",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Farinha de Trigo",
      unit: "kg",
      current_stock: 1.5,
      min_stock_alert: 1,
      notes: "Farinha tradicional tipo 1.",
      last_purchase_price: 4.8,
      last_purchase_date: "2026-08-25",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "prod-queijo",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      category_id: "cat-1",
      name: "Queijo Mussarela",
      unit: "kg",
      current_stock: 0.4,
      min_stock_alert: 0.2,
      notes: "Pedaço na geladeira.",
      last_purchase_price: 18.0,
      last_purchase_date: "2026-09-03",
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
  ],
  recipes: [
    {
      id: "rec-1",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Arroz com Ovos Caipira",
      description: "Prato rápido, reconfortante e nutritivo para o almoço ou jantar da família.",
      prep_time_minutes: 15,
      servings: 2,
      created_by_member_id: "c0a80101-0000-4000-8000-000000000002",
      instructions: [
        "Pique a cebola em cubinhos pequenos.",
        "Refogue a cebola e prepare o arroz branco soltinho.",
        "Em uma frigideira à parte, prepare os ovos no ponto desejado.",
        "Monte o prato com o arroz quente, os ovos e finalize com queijo mussarela se desejar."
      ],
      ingredients: [
        {
          id: "ing-1-1",
          recipe_id: "rec-1",
          product_id: "prod-arroz",
          product_name: "Arroz Branco",
          quantity: 300,
          unit: "g",
          is_optional: false,
          notes: "Tipo 1 bem soltinho"
        },
        {
          id: "ing-1-2",
          recipe_id: "rec-1",
          product_id: "prod-ovos",
          product_name: "Ovos de Galinha",
          quantity: 3,
          unit: "unidade",
          is_optional: false,
          notes: "Ovos frescos"
        },
        {
          id: "ing-1-3",
          recipe_id: "rec-1",
          product_id: "prod-cebola",
          product_name: "Cebola Nacional",
          quantity: 50,
          unit: "g",
          is_optional: false,
          notes: "Picadinha para refogar"
        },
        {
          id: "ing-1-4",
          recipe_id: "rec-1",
          product_id: "prod-queijo",
          product_name: "Queijo Mussarela",
          quantity: 50,
          unit: "g",
          is_optional: true,
          notes: "Opcional ralado por cima"
        }
      ],
      created_at: "2026-08-10T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "rec-2",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Feijão Tradicional da Casa",
      description: "Feijão carioca cremoso e temperado com cebola, perfeito para a semana toda.",
      prep_time_minutes: 40,
      servings: 6,
      created_by_member_id: "c0a80101-0000-4000-8000-000000000002",
      instructions: [
        "Lave bem o feijão e deixe de molho por pelo menos 30 minutos.",
        "Cozinhe na panela de pressão com água por aproximadamente 25 minutos.",
        "Em outra panela, doure a cebola picadinha e despeje uma concha de feijão para amassar e engrossar.",
        "Junte o restante do feijão cozido, acerte o sal e deixe ferver até apurar."
      ],
      ingredients: [
        {
          id: "ing-2-1",
          recipe_id: "rec-2",
          product_id: "prod-feijao",
          product_name: "Feijão Carioca",
          quantity: 500,
          unit: "g",
          is_optional: false,
          notes: "Meio pacote de 1kg"
        },
        {
          id: "ing-2-2",
          recipe_id: "rec-2",
          product_id: "prod-cebola",
          product_name: "Cebola Nacional",
          quantity: 100,
          unit: "g",
          is_optional: false,
          notes: "Para refogar bem douradinha"
        }
      ],
      created_at: "2026-08-12T11:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    },
    {
      id: "rec-3",
      house_id: "c0a80101-0000-4000-8000-000000000001",
      name: "Bolo Fofinho de Café da Tarde",
      description: "Bolo caseiro macio para acompanhar o café com leite da família.",
      prep_time_minutes: 45,
      servings: 8,
      created_by_member_id: "c0a80101-0000-4000-8000-000000000003",
      instructions: [
        "Bata os ovos até ficarem fofos.",
        "Adicione o leite e a farinha peneirada aos poucos, misturando bem.",
        "Acrescente o fermento por último com movimentos suaves.",
        "Despeje em fôrma untada e leve ao forno a 180°C por cerca de 35 minutos."
      ],
      ingredients: [
        {
          id: "ing-3-1",
          recipe_id: "rec-3",
          product_id: "prod-farinha",
          product_name: "Farinha de Trigo",
          quantity: 400,
          unit: "g",
          is_optional: false,
          notes: "Farinha peneirada"
        },
        {
          id: "ing-3-2",
          recipe_id: "rec-3",
          product_id: "prod-leite",
          product_name: "Leite Integral",
          quantity: 250,
          unit: "ml",
          is_optional: false,
          notes: "1 copo americano"
        },
        {
          id: "ing-3-3",
          recipe_id: "rec-3",
          product_id: "prod-ovos",
          product_name: "Ovos de Galinha",
          quantity: 3,
          unit: "unidade",
          is_optional: false,
          notes: "Ovos inteiros"
        },
        {
          id: "ing-3-4",
          recipe_id: "rec-3",
          product_id: "prod-fermento-ausente",
          product_name: "Fermento Químico em Pó",
          quantity: 1,
          unit: "unidade",
          is_optional: false,
          notes: "Potinho 100g (falta no estoque para demonstrar a lista de compras)"
        }
      ],
      created_at: "2026-08-15T14:00:00Z",
      updated_at: "2026-09-05T10:00:00Z"
    }
  ]
};

export const EMPTY_HOUSE_DATA: FullHouseData = {
  house: {
    id: "c0a80101-0000-4000-8000-000000000001",
    name: "Residência Principal",
    admin_id: "c0a80101-0000-4000-8000-000000000002",
    plan: "pro",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
      name: "Mariana Silva",
      email: "mariana.silva@casacontrole.app",
      role: "owner",
      avatar_color: "#e11d48",
      created_at: new Date().toISOString()
    }
  ],
  categories: DEMO_HOUSE_DATA.categories,
  products: [],
  stockMovements: [],
  consumptions: [],
  purchases: [],
  purchaseItems: [],
  priceHistory: [],
  recipes: []
};

export const INITIAL_HOUSE_DATA = DEMO_HOUSE_DATA;

