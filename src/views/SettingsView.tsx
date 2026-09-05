import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Layers, 
  Database, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink,
  Shield,
  Smartphone,
  Info
} from 'lucide-react';
import { House, UserMember, Category } from '../types';

interface SettingsViewProps {
  house: House;
  members: UserMember[];
  categories: Category[];
  onOpenAddMember: () => void;
  onOpenCategoryManager: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  house,
  members,
  categories,
  onOpenAddMember,
  onOpenCategoryManager,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);

  const copySqlToClipboard = () => {
    const sqlText = `-- Esquema Oficial CasaControle PostgreSQL / Supabase
-- Pronto para colar no SQL Editor do Supabase ou Lovable

CREATE TABLE houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE house_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    avatar_color VARCHAR(50) DEFAULT '#166534',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) DEFAULT 'Layers',
    color VARCHAR(50) DEFAULT '#059669',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(10, 2) DEFAULT 0,
    last_purchase_price NUMERIC(10, 2),
    last_purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    quantity_changed NUMERIC(10, 2) NOT NULL,
    stock_before NUMERIC(10, 2) NOT NULL,
    stock_after NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    member_id UUID REFERENCES house_members(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    member_id UUID REFERENCES house_members(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    store_name VARCHAR(255),
    notes TEXT,
    buyer_member_id UUID REFERENCES house_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_price NUMERIC(10, 2) NOT NULL,
    store_name VARCHAR(255),
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

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

      {/* 2. Gerenciamento de Membros e Categorias */}
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
CREATE TABLE price_history (id UUID, product_id UUID, unit_price NUMERIC, store_name VARCHAR(255), date DATE);`}</pre>
        </div>
      </div>

      {/* 4. Camada de IA (Princípio Fundamental) */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800">
            Princípio Fundamental: Motor Matemático vs Inteligência Artificial
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Seguindo à risca a especificação: a IA <strong>não realiza cálculos básicos</strong>. O motor determinístico (`mathEngine.ts`) calcula consumos médios, dias de estoque e sugestão de compras. A camada de IA (`src/services/ai/aiService.ts`) está isolada através de interface limpa (`IAiService`), pronta para quando ativarmos o Gemini na Etapa 2 (leitura de cupom fiscal, comandos de voz e insights comportamentais) sem alterar uma única linha da lógica essencial.
        </p>
      </div>
    </div>
  );
};
