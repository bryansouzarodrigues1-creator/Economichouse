import React, { useState } from 'react';
import { X, Users, UserPlus, Shield, User } from 'lucide-react';
import { UserMember } from '../types';

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserMember[];
  onAddMember: (data: { name: string; email?: string; role: 'admin' | 'member'; avatarColor?: string }) => Promise<void>;
}

const MEMBER_COLORS = ['#e11d48', '#ec4899', '#166534', '#1d4ed8', '#7e22ce', '#c2410c', '#0f766e'];

export const MemberManagerModal: React.FC<MemberManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
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
      <div className="w-full max-w-md bg-white/85 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-5 bg-white/60 backdrop-blur-md border-b border-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Membros da Família</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Formulário Novo Membro */}
          <form onSubmit={handleAdd} className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-rose-600" /> Adicionar Familiar
            </h3>
            <input
              type="text"
              required
              placeholder="Nome (ex: Mãe, Pai, João...)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white/80 border border-white/60 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 shadow-2xs"
            />
            <input
              type="email"
              placeholder="E-mail (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm bg-white/80 border border-white/60 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 shadow-2xs"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Papel:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="text-xs font-semibold bg-white/80 border border-white/60 rounded-xl px-2.5 py-1.5 outline-none focus:border-rose-400"
              >
                <option value="member">Familiar (Registra e Consulta)</option>
                <option value="admin">Administrador da Casa</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cor do avatar:</label>
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
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-100 transition active:scale-95"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Membro'}
            </button>
          </form>

          {/* Lista Atual de Membros */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pessoas na Casa ({members.length})</h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xs">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: m.avatar_color || '#4338ca' }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{m.name}</h4>
                      <p className="text-[11px] text-slate-500">{m.email || 'Sem e-mail cadastrado'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    m.role === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white/80 border-white/60 text-slate-700'
                  }`}>
                    {m.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {m.role === 'admin' ? 'Admin' : 'Membro'}
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
