import React, { useState } from 'react';
import { X, Users, UserPlus, Shield, User, Crown } from 'lucide-react';
import { UserMember, Role, getRoleLabel, getRoleDescription } from '../types';

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserMember[];
  onAddMember: (data: { name: string; email?: string; role: Role; avatarColor?: string }) => Promise<void>;
}

const MEMBER_COLORS = ['#e11d48', '#1d4ed8', '#0f766e', '#7e22ce', '#c2410c', '#0284c7', '#334155'];

export const MemberManagerModal: React.FC<MemberManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [avatarColor, setAvatarColor] = useState(MEMBER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMember({
        name: name.trim(),
        email: email.trim() || undefined,
        role,
        avatarColor,
      });
      setName('');
      setEmail('');
      onClose();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-5 bg-white/70 backdrop-blur-md border-b border-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Membros da Residência</h2>
              <p className="text-[11px] text-slate-500">Gestão de permissões e perfis de acesso</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Formulário Novo Membro */}
          <form onSubmit={handleAdd} className="p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-white/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-rose-600" /> Convidar Novo Membro
            </h3>
            <input
              type="text"
              required
              placeholder="Nome completo (ex: Carlos Eduardo)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white/90 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 shadow-2xs"
            />
            <input
              type="email"
              placeholder="E-mail profissional ou pessoal (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm bg-white/90 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 shadow-2xs"
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Perfil de Acesso (RBAC):</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full text-xs font-semibold bg-white/90 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-400"
              >
                <option value="owner">Proprietário (Gestor da assinatura e da residência)</option>
                <option value="admin">Administrador (Gerencia itens, receitas e convites)</option>
                <option value="member">Membro (Consumo de estoque, lista e compras)</option>
              </select>
              <p className="text-[11px] text-slate-500 pt-0.5">
                {getRoleDescription(role)}
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Identificador visual:</label>
              <div className="flex items-center gap-2">
                {MEMBER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full transition ${avatarColor === c ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md shadow-slate-900/15 transition active:scale-95"
            >
              {isSubmitting ? 'Cadastrando...' : 'Confirmar Cadastro de Membro'}
            </button>
          </form>

          {/* Lista Atual de Membros */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Membros Ativos na Residência ({members.length})</h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xs">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: m.avatar_color || '#e11d48' }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 break-words">{m.name}</h4>
                      <p className="text-[11px] text-slate-500">{m.email || 'Acesso local'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    m.role === 'owner' 
                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                      : m.role === 'admin' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {m.role === 'owner' ? <Crown className="w-3 h-3 text-rose-600" /> : m.role === 'admin' ? <Shield className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-slate-500" />}
                    {getRoleLabel(m.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
