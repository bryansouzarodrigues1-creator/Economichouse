import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  TrendingDown, 
  Camera, 
  ChefHat, 
  BarChart3, 
  Store, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  DollarSign
} from 'lucide-react';
import { House, SubscriptionPlan } from '../types';

interface MarketBuyProModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: House;
  onUpdatePlan: (newPlan: SubscriptionPlan) => Promise<void>;
}

export const MarketBuyProModal: React.FC<MarketBuyProModalProps> = ({
  isOpen,
  onClose,
  house,
  onUpdatePlan,
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const isCurrentlyPro = house.plan === 'pro';

  if (!isOpen) return null;

  const handleTogglePlan = async () => {
    try {
      setIsActivating(true);
      const nextPlan: SubscriptionPlan = isCurrentlyPro ? 'free' : 'pro';
      await onUpdatePlan(nextPlan);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-2xl w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Premium com Gradiente Azul Corporativo & Esmeralda */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 text-white overflow-hidden shrink-0">
          {/* Luzes de fundo frosted */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              MarketBuy PRO
            </span>
            <span className="text-xs text-emerald-300 font-bold">Gestão Inteligente Avançada</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Planejamento e Comparativo de Preços de Mercado
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Elimine até 28% de gastos desnecessários no supermercado com monitoramento preditivo e inteligência artificial para o seu lar.
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Card Destaque: Planejamento & Comparativo de Preços */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/80 border border-emerald-200/70 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Comparativo de Estabelecimentos & Economia
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Exclusivo PRO
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Rastreie o histórico de custos e encontre os melhores preços.</p>
              </div>
            </div>

            {/* Simulação Visual do Comparativo */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Supermercado A (Atacado)</span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">R$ 412,50</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingDown className="w-3 h-3" /> Economia de 14%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Supermercado B (Varejo)</span>
                <span className="text-sm font-black text-slate-700 block mt-0.5">R$ 479,80</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Preço médio de tabela</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-emerald-100/60 p-2.5 rounded-xl text-emerald-950 font-medium">
              <span>Projeção de Economia Mensal:</span>
              <strong className="font-extrabold text-emerald-900 text-xs">~R$ 380,00 / mês</strong>
            </div>
          </div>

          {/* Vantagens PRO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Tudo o que está incluído no MarketBuy PRO:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Chef IA Ilimitado</h5>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Gere quantas receitas desejar por dia (gratuito limitado a 1/dia).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Leitura de Cupom Fiscal</h5>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Fotografe a nota fiscal para cadastrar compras e preços automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Projeção de Faturamento</h5>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Previsão precisa de desembolso mensal da casa para os próximos 6 meses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Membros Ilimitados (RBAC)</h5>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Adicione todos os residentes com papéis diferenciados de acesso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Botão de Ação */}
        <div className="p-5 sm:p-6 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Status Atual</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {isCurrentlyPro ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Assinatura Ativa (PRO)
                </span>
              ) : (
                <span className="text-slate-600">Plano Gratuito Ativo</span>
              )}
            </span>
          </div>

          <button
            onClick={handleTogglePlan}
            disabled={isActivating}
            className={`w-full sm:w-auto px-7 py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-95 ${
              isCurrentlyPro
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 hover:from-emerald-700 hover:to-blue-800 text-white shadow-emerald-500/20'
            }`}
          >
            {isActivating ? (
              <span>Atualizando...</span>
            ) : isCurrentlyPro ? (
              <span>Reverter para Plano Gratuito</span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                <span>Ativar MarketBuy PRO Agora</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
