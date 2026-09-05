import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat,
  Sparkles,
  ShoppingCart, 
  TrendingDown, 
  ReceiptText, 
  Settings 
} from 'lucide-react';

export type NavTab = 'dashboard' | 'stock' | 'recipes' | 'assistant' | 'shopping_list' | 'consumption' | 'purchases' | 'settings';

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
    { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
    { id: 'stock' as NavTab, label: 'Estoque', icon: Package },
    { id: 'recipes' as NavTab, label: 'Receitas', icon: ChefHat },
    { 
      id: 'shopping_list' as NavTab, 
      label: 'Comprar', 
      icon: ShoppingCart, 
      badge: buyNowCount > 0 ? buyNowCount : undefined 
    },
    { id: 'consumption' as NavTab, label: 'Consumo', icon: TrendingDown },
    { id: 'purchases' as NavTab, label: 'Compras', icon: ReceiptText },
    { id: 'settings' as NavTab, label: 'Casa', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none pb-safe">
      <div className="max-w-lg mx-auto pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/15 px-2 sm:px-4 py-2 rounded-full flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              id={`tab-btn-${tab.id}`}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-white opacity-100 scale-105' 
                  : 'text-white/60 hover:text-white/90 hover:opacity-100'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-rose-400' : 'stroke-[1.75]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[58px] font-semibold ${
                isActive ? 'text-white font-bold' : 'text-white/70'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-3 h-1 rounded-full bg-rose-400 shadow-sm shadow-rose-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
