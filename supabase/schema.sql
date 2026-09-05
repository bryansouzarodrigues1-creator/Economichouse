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
    planning_days INT NOT NULL DEFAULT 30 CHECK (planning_days > 0),
    low_stock_days_threshold INT NOT NULL DEFAULT 7 CHECK (low_stock_days_threshold >= 0),
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
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_alert NUMERIC(12, 3) DEFAULT 0 CHECK (min_stock_alert >= 0),
    notes TEXT,
    last_purchase_price NUMERIC(12, 2) CHECK (last_purchase_price >= 0),
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
    previous_stock NUMERIC(12, 3) NOT NULL CHECK (previous_stock >= 0),
    new_stock NUMERIC(12, 3) NOT NULL CHECK (new_stock >= 0),
    reason TEXT,
    performed_by_member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: consumptions (Registros de Consumo Doméstico)
CREATE TABLE IF NOT EXISTS public.consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: purchases (Registros de Compras Realizadas)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    store_name VARCHAR(255),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
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
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: price_history (Histórico de Preços para Evolução e Médias)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    store_name VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA PREPARADA: recipes (Receitas Familiares - Próxima Etapa)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time_minutes INT CHECK (prep_time_minutes >= 0),
    servings INT CHECK (servings > 0),
    instructions JSONB DEFAULT '[]'::jsonb,
    created_by_member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA PREPARADA: recipe_ingredients (Ingredientes das Receitas vinculados ao Estoque)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_recipes_house ON public.recipes(house_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Isolamento Seguro Multi-Tenant por Casa
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
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para validar vínculo do usuário autenticado com a casa
CREATE OR REPLACE FUNCTION public.user_belongs_to_house(target_house_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.house_members
        WHERE house_id = target_house_id
        AND email = auth.jwt() ->> 'email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de Políticas Prontas de RLS
CREATE POLICY "Membros acessam produtos de sua casa" ON public.products
    FOR ALL USING (public.user_belongs_to_house(house_id));

CREATE POLICY "Membros acessam movimentações de sua casa" ON public.stock_movements
    FOR ALL USING (public.user_belongs_to_house(house_id));

CREATE POLICY "Membros acessam consumos de sua casa" ON public.consumptions
    FOR ALL USING (public.user_belongs_to_house(house_id));

CREATE POLICY "Membros acessam compras de sua casa" ON public.purchases
    FOR ALL USING (public.user_belongs_to_house(house_id));

CREATE POLICY "Membros acessam receitas de sua casa" ON public.recipes
    FOR ALL USING (public.user_belongs_to_house(house_id));

CREATE POLICY "Membros acessam ingredientes de receitas de sua casa" ON public.recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_ingredients.recipe_id
            AND public.user_belongs_to_house(r.house_id)
        )
    );

