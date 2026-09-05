-- ==============================================================================
-- CasaControle - Esquema Oficial de Banco de Dados (Supabase / PostgreSQL)
-- Pronto para importação direta no Supabase e Lovable
-- ==============================================================================

-- Habilita extensão de UUID caso ainda não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: houses (Casas / Famílias)
CREATE TABLE IF NOT EXISTS public.houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    admin_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA: house_members (Membros da Casa)
CREATE TABLE IF NOT EXISTS public.house_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    avatar_color VARCHAR(50) DEFAULT '#166534',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: house_settings (Configurações de cada Casa)
CREATE TABLE IF NOT EXISTS public.house_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL UNIQUE REFERENCES public.houses(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    planning_days INT NOT NULL DEFAULT 30,
    low_stock_days_threshold INT NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: categories (Categorias de Produtos)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(100) DEFAULT 'Layers',
    color VARCHAR(50) DEFAULT '#059669',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA: products (Produtos Cadastrados)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(12, 3) DEFAULT 0,
    notes TEXT,
    last_purchase_price NUMERIC(12, 2),
    last_purchase_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: stock_movements (Histórico e Auditoria de Movimentações de Estoque)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'consumption', 'addition', 'removal', 'manual_adjustment')),
    quantity_delta NUMERIC(12, 3) NOT NULL,
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reason TEXT,
    performed_by_member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: consumptions (Registros de Consumo Doméstico)
CREATE TABLE IF NOT EXISTS public.consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: purchases (Registros de Compras Realizadas)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    store_name VARCHAR(255),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    buyer_member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: purchase_items (Itens de Cada Compra)
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: price_history (Histórico de Preços para Evolução e Médias)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_price NUMERIC(12, 2) NOT NULL,
    store_name VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_house ON public.house_members(house_id);
CREATE INDEX IF NOT EXISTS idx_categories_house ON public.categories(house_id);
CREATE INDEX IF NOT EXISTS idx_products_house ON public.products(house_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_product_date ON public.consumptions(product_id, date);
CREATE INDEX IF NOT EXISTS idx_purchases_house_date ON public.purchases(house_id, date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON public.price_history(product_id, date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Isolamento Seguro por Casa
-- ==============================================================================
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Exemplo de política de isolamento básico:
-- Membros autenticados têm acesso apenas aos dados da sua casa (house_id)
-- CREATE POLICY "Membros acessam apenas sua casa" ON public.products
--     FOR ALL USING (house_id IN (SELECT house_id FROM public.house_members WHERE email = auth.jwt() ->> 'email'));
