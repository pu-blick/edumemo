
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminUserView } from '../types';
import { ShieldCheck, Mail, Calendar, UserX, UserCheck, Search, Loader2, Key, AlertCircle } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, resetPassword } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.rpc('admin_get_users');
      if (!error && data) {
        setUsers(data as AdminUserView[]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleUserStatus = async (target: AdminUserView) => {
    const newStatus = target.status === 'active' ? 'blocked' : 'active';
    if (!window.confirm(`이 사용자의 계정 상태를 ${newStatus === 'blocked' ? '비활성화(Block)' : '활성화'}하시겠습니까?`)) return;
    setProcessingId(target.id);
    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        p_target_user_id: target.id,
        p_status: newStatus,
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, status: newStatus as 'active' | 'blocked' } : u));
    } catch {
      alert('상태 변경 실패');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!window.confirm(`${email} 주소로 비밀번호 재설정 링크를 발송하시겠습니까?`)) return;
    const { error } = await resetPassword(email);
    if (!error) alert('재설정 이메일이 발송되었습니다.');
    else alert('발송 실패');
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
      <p className="text-slate-400 font-black tracking-widest text-[11px] uppercase">Accessing Master Database...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-4 flex items-center gap-4">
          <ShieldCheck size={48} className="text-rose-600" /> 시스템 관리 콘솔
        </h1>
        <p className="text-slate-400 font-bold text-lg">Edumemo를 이용 중인 교사 계정을 통합 관리합니다.</p>
      </div>

      <div className="mb-10 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
        <input
          type="text"
          placeholder="교사 이메일 주소로 검색..."
          className="w-full pl-16 pr-8 py-6 rounded-[2rem] glass focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-xl shadow-xl transition-all border-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="glass rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-white/50">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">교사 계정 (Email)</th>
              <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">플랜 / 크레딧</th>
              <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">가입 일자</th>
              <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">계정 상태</th>
              <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">마스터 액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-white/80 transition-all">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600 opacity-50'}`}>
                      <Mail size={22} />
                    </div>
                    <span className={`font-black text-lg ${u.status === 'blocked' ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{u.email}</span>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase">{u.plan}</span>
                    <span className="text-[11px] text-slate-400">{u.credits} 크레딧</span>
                  </div>
                </td>
                <td className="px-10 py-8 text-slate-400 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-10 py-8 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {u.status === 'active' ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleResetPassword(u.email)}
                      className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                      title="비밀번호 재설정 이메일 발송"
                    >
                      <Key size={18} />
                    </button>
                    <button
                      disabled={processingId === u.id || u.id === user?.id}
                      onClick={() => toggleUserStatus(u)}
                      className={`p-3 rounded-xl transition-all shadow-sm disabled:opacity-40 ${u.status === 'active' ? 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                      title={u.status === 'active' ? '계정 차단' : '계정 복구'}
                    >
                      {processingId === u.id ? <Loader2 className="animate-spin" size={18} /> : (u.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />)}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-10 py-32 text-center text-slate-300 font-black text-2xl">
                  해당 조건의 사용자를 찾을 수 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10 p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
        <AlertCircle size={32} className="text-amber-400 shrink-0" />
        <div className="text-sm font-bold leading-relaxed opacity-80">
          관리자 메뉴 유의사항: 사용자 차단 시 해당 계정의 로그인이 제한됩니다.
          비밀번호 분실 문의 시 'Key' 아이콘을 통해 재설정 링크를 직접 발송해 주세요.
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
