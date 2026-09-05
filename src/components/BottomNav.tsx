import React from 'react';
import { Package, ShoppingCart, Sparkles } from 'lucide-react';

export type NavTab = 'stock' | 'shopping_list' | 'recipes' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  buyNowCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  buyNowCount,
}) => {
  const tabs = [
    { 
      id: 'stock' as NavTab, 
      label: 'Despensa', 
      emoji: '📦',
      icon: Package 
    },
    { 
      id: 'shopping_list' as NavTab, 
      label: 'Lista de Compras', 
      emoji: '🛒',
      icon: ShoppingCart, 
      badge: buyNowCount > 0 ? buyNowCount : undefined 
    },
    { 
      id: 'recipes' as NavTab, 
      label: 'Chef IA (Receitas)', 
      emoji: '🍳',
      icon: Sparkles 
    },
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none pb-safe max-w-full">
      <div className="max-w-md w-full mx-auto pointer-events-auto bg-white/90 backdrop-blur-2xl border border-white/80 px-2 py-1.5 rounded-2xl sm:rounded-full grid grid-cols-3 gap-1 shadow-2xl shadow-slate-900/15">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              id={`tab-btn-${tab.id}`}
              className={`relative flex flex-col items-center justify-center w-full py-2 min-h-[52px] rounded-xl sm:rounded-full transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive 
                  ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 text-white shadow-md shadow-slate-900/20 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-semibold'
              }`}
              title={tab.label}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-emerald-300' : 'stroke-[1.75] text-slate-500'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-xs animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] mt-1 tracking-tight text-center leading-tight break-words hyphens-auto px-1 ${
                isActive ? 'text-white font-bold' : 'text-slate-600'
              }`}>
                {tab.emoji} {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
