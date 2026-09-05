import React, { useState } from 'react';
import { Settings, Sparkles, ChevronDown, Search, Zap } from 'lucide-react';
import { House, UserMember, getRoleLabel } from '../types';

interface NavbarProps {
  house: House;
  members?: UserMember[];
  activeMemberId?: string;
  onSelectMember?: (id: string) => void;
  isSettingsActive?: boolean;
  onOpenSettings: () => void;
  onOpenSearchOrCatalog: (initialQuery?: string) => void;
  onOpenProModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  house,
  members = [],
  activeMemberId,
  onSelectMember,
  isSettingsActive = false,
  onOpenSettings,
  onOpenSearchOrCatalog,
  onOpenProModal,
}) => {
  const [quickSearch, setQuickSearch] = useState('');
  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];
  const isPro = house.plan === 'pro';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSearchOrCatalog(quickSearch);
    setQuickSearch('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-xs max-w-full">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Identidade MarketBuy & Residência */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div 
            onClick={() => onOpenSearchOrCatalog()}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-slate-900 via-blue-900 to-emerald-700 rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl shadow-md shadow-blue-950/20 shrink-0 cursor-pointer hover:scale-105 transition"
            title="MarketBuy"
          >
            🛒
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                Market<span className="text-emerald-600">Buy</span>
              </span>
              <button
                onClick={onOpenProModal}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border transition active:scale-95 ${
                  isPro 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Ver detalhes do plano"
              >
                {isPro ? (
                  <>
                    <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                    <span>PRO</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-slate-500" />
                    <span>Free</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-500 text-xs truncate max-w-[140px] sm:max-w-xs mt-0.5 font-medium">
              <span className="text-slate-400 font-semibold">Residência:</span> {house.name || 'Residência Principal'}
            </p>
          </div>
        </div>

        {/* Barra de Busca Rápida com Lupa (🔍) */}
        <div className="flex-1 max-w-xs sm:max-w-sm hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Buscar produtos ou catálogo (🔍)..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
            <button
              type="button"
              onClick={() => onOpenSearchOrCatalog(quickSearch)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-emerald-700 bg-white/70 px-1.5 py-0.5 rounded-lg border border-slate-200"
            >
              Catálogo
            </button>
          </form>
        </div>

        {/* Lado Direito: Busca Mobile + Seletor de Membro (RBAC) + Engrenagem de Configurações (⚙️) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Busca Mobile (🔍) */}
          <button
            onClick={() => onOpenSearchOrCatalog()}
            className="md:hidden w-10 h-10 rounded-2xl bg-white/80 hover:bg-white text-slate-700 border border-white/60 shadow-2xs flex items-center justify-center transition active:scale-95"
            title="Buscar Produtos (🔍)"
            aria-label="Buscar Produtos"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Seletor de Membro Ativo (RBAC) */}
          {members.length > 0 && activeMember && onSelectMember && (
            <div className="relative flex items-center">
              <select
                id="select-active-member"
                aria-label="Selecionar Membro Ativo"
                value={activeMember.id}
                onChange={(e) => onSelectMember(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({getRoleLabel(m.role)})
                  </option>
                ))}
              </select>
              <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-white/70 hover:bg-white border border-white/60 shadow-2xs transition cursor-pointer">
                <span
                  className="w-7 h-7 rounded-xl text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: activeMember.avatar_color || '#0284c7' }}
                >
                  {activeMember.name.charAt(0).toUpperCase()}
                </span>
                <div className="text-left leading-none max-w-[90px] sm:max-w-[120px]">
                  <p className="text-xs font-bold text-slate-800 truncate">{activeMember.name}</p>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{getRoleLabel(activeMember.role)}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Ícone de Engrenagem (⚙️ Configurações / Perfil) */}
          <button
            onClick={onOpenSettings}
            id="btn-open-settings-header"
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation border ${
              isSettingsActive
                ? 'bg-slate-900 text-white border-slate-800 shadow-md shadow-slate-900/15 ring-2 ring-emerald-500/30'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-white/60 shadow-2xs'
            }`}
            title="Configurações / Perfil (⚙️)"
            aria-label="Configurações e Perfil"
          >
            <Settings className={`w-5 h-5 ${isSettingsActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
