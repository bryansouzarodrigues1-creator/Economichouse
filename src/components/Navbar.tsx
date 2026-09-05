import React from 'react';
import { Home, Plus } from 'lucide-react';
import { House, UserMember, Purchase } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatCurrency } from '../utils/mathEngine';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  house: House;
  members: UserMember[];
  activeMemberId?: string;
  purchases?: Purchase[];
  onSelectMember: (id: string) => void;
  onOpenQuickAction: (actionType?: 'consumption' | 'purchase' | 'stock_adjustment') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  house,
  members,
  activeMemberId,
  purchases = [],
  onSelectMember,
  onOpenQuickAction,
}) => {
  const isOnline = useOnlineStatus();
  const activeMember = members.find(m => m.id === activeMemberId) || members[0];

  // Cálculo do gasto do mês corrente para a pílula de destaque
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthSpent = purchases
    .filter(p => p.date?.startsWith(currentYearMonth))
    .reduce((acc, p) => acc + (p.total_amount || 0), 0);

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-lg border-b border-white/40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
        {/* Brand & House */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-rose-200/70 shrink-0">
            🏠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">CasaControle</h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100/90 text-rose-700 border border-rose-200/60 uppercase tracking-wider">
                Familiar
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                isOnline 
                  ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
              }`} title={isOnline ? 'Conectado à internet e sincronizado' : 'Modo offline: gravando com segurança no aparelho'}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-600'}`} />
                <span>{isOnline ? 'Online' : 'Modo Offline (Salvando no Aparelho)'}</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">
              {activeMember?.name ? `Bem-vinda, ${activeMember.name.split(' ')[0]}` : house.name} • {house.name}
            </p>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gasto Total Pill (From Design HTML) */}
          <div className="hidden lg:flex bg-white/60 backdrop-blur-lg border border-white/40 px-5 py-2 rounded-full items-center gap-2 shadow-xs">
            <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Gasto Total</span>
            <span className="text-slate-800 font-bold text-sm sm:text-base">
              {formatCurrency(currentMonthSpent)}
            </span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* New Item / Quick Record Button */}
          <button
            onClick={() => onOpenQuickAction('consumption')}
            id="btn-quick-record"
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 rounded-full font-bold shadow-md shadow-rose-200/80 hover:shadow-rose-300 active:scale-95 transition-all text-xs sm:text-sm flex items-center gap-1.5"
            title="Registrar consumo ou compra rápido"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar</span>
          </button>

          {/* Member Picker Pill */}
          {members.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-lg border border-white/40 px-2 sm:px-3 py-1.5 rounded-full shadow-xs">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                style={{ backgroundColor: activeMember?.avatar_color || '#4f46e5' }}
                title={`Membro ativo: ${activeMember?.name}`}
              >
                {activeMember?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <select
                value={activeMemberId || activeMember?.id}
                onChange={(e) => onSelectMember(e.target.value)}
                aria-label="Selecionar membro ativo da família"
                className="text-xs font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer hidden sm:block outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

