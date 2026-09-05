import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Layers, 
  Database, 
  Check, 
  Copy, 
  Shield,
  Smartphone,
  Info,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Download,
  Share2,
  Wifi
} from 'lucide-react';
import { House, UserMember, Category } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface SettingsViewProps {
  house: House;
  members: UserMember[];
  categories: Category[];
  onOpenAddMember: () => void;
  onOpenCategoryManager: () => void;
  onResetToDemo?: () => void;
  onResetToEmpty?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  house,
  members,
  categories,
  onOpenAddMember,
  onOpenCategoryManager,
  onResetToDemo,
  onResetToEmpty,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [confirmReset, setConfirmReset] = useState<'demo' | 'empty' | null>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallFeedback('Aplicativo instalado com sucesso na sua tela inicial!');
    } else if (isIOS) {
      setInstallFeedback('No iPhone/iPad: Toque no botão de Compartilhar do Safari e selecione "Adicionar à Tela de Início".');
    }
  };

  const copySqlToClipboard = () => {
    const sqlText = `-- Esquema Oficial CasaControle PostgreSQL / Supabase
-- Pronto para colar no SQL Editor do Supabase ou Lovable

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    admin_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.house_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    avatar_color VARCHAR(50) DEFAULT '#166534',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.house_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL UNIQUE REFERENCES public.houses(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    planning_days INT NOT NULL DEFAULT 30 CHECK (planning_days > 0),
    low_stock_days_threshold INT NOT NULL DEFAULT 7 CHECK (low_stock_days_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(100) DEFAULT 'Layers',
    color VARCHAR(50) DEFAULT '#059669',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    member_id UUID REFERENCES public.house_members(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Tabelas Preparadas para Receitas
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time_minutes INT CHECK (prep_time_minutes >= 0),
    servings INT CHECK (servings > 0),
    instructions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Casa & Configurações</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gerenciamento da família, categorias, banco de dados Supabase e arquitetura.
        </p>
      </div>

      {/* 1. Identificação da Casa */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Residência Ativa</span>
            <h2 className="text-lg font-bold text-slate-800">{house.name}</h2>
            <p className="text-xs text-slate-500">{house.description || 'Ambiente familiar privativo'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/40 text-xs">
          <div className="p-3.5 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/50">
            <span className="text-slate-400 block font-medium">Moeda Padrão:</span>
            <span className="font-bold text-slate-800">Real Brasileiro (R$ - BRL)</span>
          </div>
          <div className="p-3.5 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/50">
            <span className="text-slate-400 block font-medium">Fuso Horário:</span>
            <span className="font-bold text-slate-800">America/Sao_Paulo</span>
          </div>
          <div className="p-3.5 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/50 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block font-medium">Tipo de Uso:</span>
            <span className="font-bold text-rose-600">Familiar (Sem fins comerciais)</span>
          </div>
        </div>
      </div>

      {/* 2. Instalação PWA & Uso Offline */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
              <Smartphone className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Instalar Aplicativo no Celular (PWA)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isInstalled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {isInstalled ? '✓ Já Instalado' : 'Pronto para Instalar'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Funciona em tela cheia como um aplicativo nativo e continua funcionando mesmo sem internet no supermercado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 active:scale-95 transition"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>📱 Instalar App no Celular</span>
              </button>
            )}
          </div>
        </div>

        {installFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{installFeedback}</span>
          </div>
        )}

        {/* Guias passo a passo por sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Android / Chrome */}
          <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>No celular Android (Google Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
              <li>Clique no botão <strong>"📱 Instalar App no Celular"</strong> acima;</li>
              <li>Ou toque nos <strong>3 pontinhos (⋮)</strong> no topo do navegador;</li>
              <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
            </ol>
          </div>

          {/* iPhone / Safari */}
          <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>No iPhone ou iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
              <li>Toque no botão de <strong>Compartilhar</strong> (ícone com quadrado e seta para cima);</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>;</li>
              <li>Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        </div>

        {/* Garantia de isolamento e offline */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
          <Shield className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p>
            <strong>Isolamento seguro e sem internet:</strong> O aplicativo salva todos os dados no armazenamento interno do seu aparelho (IndexedDB/LocalStorage). Quando a conexão cai, você pode continuar registrando sem perder nada.
          </p>
        </div>
      </div>

      {/* 3. Gerenciamento de Membros e Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Membros */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-800">Membros da Família</h3>
              </div>
              <span className="text-xs font-bold bg-white/80 border border-white/60 text-slate-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                {members.length} {members.length === 1 ? 'pessoa' : 'pessoas'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Familiares autorizados a registrar consumos, compras e conferir a despensa.
            </p>

            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/40">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: m.avatar_color || '#e11d48' }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    {m.role === 'admin' ? 'Administrador' : 'Membro'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenAddMember}
            className="w-full py-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition"
          >
            + Gerenciar / Adicionar Familiar
          </button>
        </div>

        {/* Categorias */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-800">Categorias da Despensa</h3>
              </div>
              <span className="text-xs font-bold bg-white/80 border border-white/60 text-slate-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                {categories.length} categorias
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Organização dos produtos da casa (Alimentos, Limpeza, Higiene...).
            </p>

            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2.5 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/40">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#f43f5e' }} />
                  <span className="text-xs font-semibold text-slate-800 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenCategoryManager}
            className="w-full py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-100 active:scale-95 transition"
          >
            + Gerenciar / Adicionar Categoria
          </button>
        </div>
      </div>

      {/* 3. Camada de Arquitetura: Preparada para Supabase & PostgreSQL */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Migração Futura: PostgreSQL & Supabase
              </h3>
              <p className="text-xs text-slate-500">
                A modelagem de dados do CasaControle foi construída em conformidade com SQL relacional moderno.
              </p>
            </div>
          </div>

          <button
            onClick={copySqlToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-800 hover:bg-indigo-100 text-xs font-bold transition shrink-0"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        <div className="bg-slate-900/95 backdrop-blur-md text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-44 border border-white/10">
          <pre>{`-- Arquivo /supabase/schema.sql incluído no projeto
CREATE TABLE houses (id UUID PRIMARY KEY, name VARCHAR(255), currency VARCHAR(10) DEFAULT 'BRL');
CREATE TABLE house_members (id UUID, house_id UUID REFERENCES houses(id), name VARCHAR(255), role VARCHAR(50));
CREATE TABLE categories (id UUID, house_id UUID REFERENCES houses(id), name VARCHAR(255), color VARCHAR(50));
CREATE TABLE products (id UUID, house_id UUID, category_id UUID, name VARCHAR(255), unit VARCHAR(50), current_stock NUMERIC);
CREATE TABLE stock_movements (id UUID, product_id UUID, quantity_changed NUMERIC, stock_before NUMERIC, stock_after NUMERIC);
CREATE TABLE consumptions (id UUID, product_id UUID, quantity NUMERIC, date DATE, member_id UUID);
CREATE TABLE purchases (id UUID, total_amount NUMERIC, store_name VARCHAR(255), date DATE);
CREATE TABLE purchase_items (id UUID, purchase_id UUID, product_id UUID, quantity NUMERIC, unit_price NUMERIC);
CREATE TABLE price_history (id UUID, product_id UUID, unit_price NUMERIC, store_name VARCHAR(255), date DATE);
CREATE TABLE recipes (id UUID PRIMARY KEY, house_id UUID, name VARCHAR(255), prep_time_minutes INT, servings INT);
CREATE TABLE recipe_ingredients (id UUID PRIMARY KEY, recipe_id UUID, product_id UUID, quantity NUMERIC, unit VARCHAR(50));`}</pre>
        </div>
      </div>

      {/* 4. Motor Matemático Doméstico */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-800">
            Motor Matemático Determinístico & Privacidade Familiar
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          O CasaControle calcula consumos médios, previsão de estoque e reposição através de fórmulas exatas no próprio aparelho, garantindo privacidade completa e funcionamento contínuo mesmo sem conexão com a internet.
        </p>
      </div>

      {/* 5. Separação de Dados Demo vs Dados Reais da Família */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Dados do Sistema: Demonstração vs Família Real
            </h3>
            <p className="text-xs text-slate-500">
              Alterne entre os dados de demonstração (arroz, feijão, histórico) e uma casa limpa para uso real.
            </p>
          </div>
        </div>

        {confirmReset && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-amber-900">
              {confirmReset === 'demo' 
                ? 'Tem certeza que deseja restaurar os dados de demonstração? Seus produtos atuais serão substituídos pelo exemplo.'
                : 'Tem certeza que deseja limpar os dados para iniciar o uso real da família? O estoque e histórico serão zerados.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirmReset === 'demo' && onResetToDemo) onResetToDemo();
                  if (confirmReset === 'empty' && onResetToEmpty) onResetToEmpty();
                  setConfirmReset(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-xs active:scale-95 transition"
              >
                Sim, confirmar
              </button>
              <button
                onClick={() => setConfirmReset(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setConfirmReset('demo')}
            className="p-3.5 bg-white/60 hover:bg-white/85 border border-white/50 rounded-2xl text-left flex items-start gap-3 transition"
          >
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Restaurar Dados Demonstração</span>
              <span className="text-[11px] text-slate-500">Recarregar itens e histórico de exemplo pré-calculados.</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset('empty')}
            className="p-3.5 bg-white/60 hover:bg-white/85 border border-white/50 rounded-2xl text-left flex items-start gap-3 transition"
          >
            <Trash2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Iniciar Casa Limpa (Dados Reais)</span>
              <span className="text-[11px] text-slate-500">Zerar itens e manter categorias para cadastrar seus mantimentos.</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
