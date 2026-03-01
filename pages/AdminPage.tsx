
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminUserView } from '../types';
import { ShieldCheck, Mail, Calendar, UserX, UserCheck, Search, Loader2, Key, AlertCircle, ChevronDown, Trash2, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

interface AdminClassroom {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  student_count: number;
  created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Basic',
  plus: 'Pro',
  school: 'School',
  tester: 'Event',
  test: 'Event',
  event: 'Event',
};
const getPlanLabel = (plan: string) => PLAN_LABELS[plan] || plan;

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-indigo-100 text-indigo-700',
  plus: 'bg-violet-100 text-violet-700',
  school: 'bg-emerald-100 text-emerald-700',
  tester: 'bg-amber-100 text-amber-700',
  test: 'bg-amber-100 text-amber-700',
  event: 'bg-amber-100 text-amber-700',
};
const getPlanColor = (plan: string) => PLAN_COLORS[plan] || 'bg-slate-100 text-slate-600';

const AdminPage: React.FC = () => {
  const { user, resetPassword } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [classrooms, setClassrooms] = useState<AdminClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const classroomsByUser = useMemo(() => {
    const map: Record<string, AdminClassroom[]> = {};
    classrooms.forEach(c => {
      if (!map[c.user_id]) map[c.user_id] = [];
      map[c.user_id].push(c);
    });
    return map;
  }, [classrooms]);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, classroomsRes] = await Promise.all([
        supabase.rpc('admin_get_users'),
        supabase.rpc('admin_get_classrooms'),
      ]);
      if (!usersRes.error && usersRes.data) setUsers(usersRes.data as AdminUserView[]);
      if (!classroomsRes.error && classroomsRes.data) setClassrooms(classroomsRes.data as AdminClassroom[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleUserStatus = async (target: AdminUserView) => {
    const newStatus = target.status === 'active' ? 'blocked' : 'active';
    if (!await confirm(`이 사용자의 계정 상태를 ${newStatus === 'blocked' ? '비활성화(Block)' : '활성화'}하시겠습니까?`)) return;
    setProcessingId(target.id);
    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        p_target_user_id: target.id,
        p_status: newStatus,
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, status: newStatus as 'active' | 'blocked' } : u));
    } catch {
      showToast('상태 변경 실패', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!await confirm(`${email} 주소로 비밀번호 재설정 링크를 발송하시겠습니까?`)) return;
    const { error } = await resetPassword(email);
    if (!error) showToast('재설정 이메일이 발송되었습니다.', 'success');
    else showToast('발송 실패', 'error');
  };

  const handleDeleteClassroom = async (classroom: AdminClassroom) => {
    if (!await confirm(`'${classroom.name}' 채널을 삭제하시겠습니까?\n(소속 학생 데이터도 함께 삭제됩니다)`)) return;
    setProcessingId(classroom.id);
    try {
      const { error } = await supabase.rpc('admin_delete_classroom', {
        p_classroom_id: classroom.id,
      });
      if (error) throw error;
      setClassrooms(prev => prev.filter(c => c.id !== classroom.id));
      showToast('채널이 삭제되었습니다.', 'success');
    } catch {
      showToast('채널 삭제 실패', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
      <p className="text-slate-400 font-black tracking-widest text-[11px] uppercase">Accessing Master Database...</p>
    </div>
  );

  const renderClassrooms = (userId: string) => {
    const userClassrooms = classroomsByUser[userId] || [];
    if (userClassrooms.length === 0) return (
      <div className="text-center text-slate-300 text-sm font-bold py-4">채널 없음</div>
    );
    return (
      <div className="space-y-2">
        {userClassrooms.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-3 border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <Users size={14} />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-700 block truncate">{c.name}</span>
                <span className="text-[11px] text-slate-400">학생 {c.student_count}명 · {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              disabled={processingId === c.id}
              onClick={() => handleDeleteClassroom(c)}
              className="p-2 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-40 shrink-0"
              title="채널 삭제"
            >
              {processingId === c.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4">
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-2 sm:mb-4 flex items-center gap-2 sm:gap-4">
          <ShieldCheck size={28} className="text-rose-600 sm:w-12 sm:h-12 shrink-0" /> 시스템 관리 콘솔
        </h1>
        <p className="text-slate-400 font-bold text-sm sm:text-lg">Edumemo를 이용 중인 교사 계정을 통합 관리합니다.</p>
      </div>

      <div className="mb-6 md:mb-10 relative">
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input
          type="text"
          placeholder="교사 이메일 주소로 검색..."
          className="w-full pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-6 rounded-2xl sm:rounded-[2rem] glass focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-base sm:text-xl shadow-xl transition-all border-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 모바일: 카드 레이아웃 */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map(u => {
          const userClassroomCount = (classroomsByUser[u.id] || []).length;
          const isExpanded = expandedUserId === u.id;
          return (
            <div key={u.id} className="glass rounded-2xl border-2 border-white shadow-lg bg-white/50">
              <div className="p-4">
                {/* 1줄: 이메일 + 상태 */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${u.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600 opacity-50'}`}>
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`font-black text-sm block truncate ${u.status === 'blocked' ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{u.email}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={10} className="text-slate-300" />
                      <span className="text-[10px] text-slate-400">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {u.status === 'active' ? 'Active' : 'Blocked'}
                  </span>
                </div>
                {/* 2줄: 플랜 + 크레딧 */}
                <div className="flex items-center gap-2 mb-3 ml-12">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${getPlanColor(u.plan)}`}>{getPlanLabel(u.plan)}</span>
                  <span className="text-[11px] text-slate-400">{u.credits} 크레딧</span>
                </div>
                {/* 3줄: 채널 + 액션 버튼 */}
                <div className="flex items-center justify-between ml-12">
                  <button
                    onClick={() => toggleExpand(u.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Users size={12} /> 채널 {userClassroomCount}
                    <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetPassword(u.email)}
                      className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm"
                      title="비밀번호 재설정"
                    >
                      <Key size={14} />
                    </button>
                    <button
                      disabled={processingId === u.id || u.id === user?.id}
                      onClick={() => toggleUserStatus(u)}
                      className={`p-2 rounded-lg transition-all shadow-sm disabled:opacity-40 ${u.status === 'active' ? 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                      title={u.status === 'active' ? '계정 차단' : '계정 복구'}
                    >
                      {processingId === u.id ? <Loader2 className="animate-spin" size={14} /> : (u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />)}
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                  {renderClassrooms(u.id)}
                </div>
              )}
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-black text-lg">
            해당 조건의 사용자를 찾을 수 없습니다.
          </div>
        )}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden md:block glass rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 lg:px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">교사 (Email)</th>
                <th className="px-4 lg:px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">플랜</th>
                <th className="px-4 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">채널</th>
                <th className="px-4 lg:px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">가입일</th>
                <th className="px-4 lg:px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                <th className="px-4 lg:px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => {
                const userClassroomCount = (classroomsByUser[u.id] || []).length;
                const isExpanded = expandedUserId === u.id;
                return (
                  <React.Fragment key={u.id}>
                    <tr className="hover:bg-white/80 transition-all">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${u.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600 opacity-50'}`}>
                            <Mail size={18} />
                          </div>
                          <span className={`font-black text-sm truncate ${u.status === 'blocked' ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md w-fit ${getPlanColor(u.plan)}`}>{getPlanLabel(u.plan)}</span>
                          <span className="text-[11px] text-slate-400">{u.credits} 크레딧</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleExpand(u.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          <Users size={13} /> {userClassroomCount}
                          <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-slate-400 font-bold text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.status === 'active' ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(u.email)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm text-xs font-bold"
                            title="비밀번호 재설정 이메일 발송"
                          >
                            <Key size={14} /> PW
                          </button>
                          <button
                            disabled={processingId === u.id || u.id === user?.id}
                            onClick={() => toggleUserStatus(u)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shadow-sm text-xs font-bold disabled:opacity-40 ${u.status === 'active' ? 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                            title={u.status === 'active' ? '계정 차단' : '계정 복구'}
                          >
                            {processingId === u.id ? <Loader2 className="animate-spin" size={14} /> : (u.status === 'active' ? <><UserX size={14} /> 차단</> : <><UserCheck size={14} /> 복구</>)}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 lg:px-6 py-3 bg-slate-50/50">
                          <div className="border-l-4 border-indigo-200 pl-4">
                            {renderClassrooms(u.id)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-slate-300 font-black text-xl">
                    해당 조건의 사용자를 찾을 수 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 md:mt-10 p-5 sm:p-8 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-6 shadow-2xl">
        <AlertCircle size={24} className="text-amber-400 shrink-0 sm:w-8 sm:h-8" />
        <div className="text-[12px] sm:text-sm font-bold leading-relaxed opacity-80">
          관리자 유의사항: 사용자 차단 시 해당 계정의 로그인이 제한됩니다.
          비밀번호 분실 문의 시 PW 버튼으로 재설정 링크를 발송해 주세요.
          채널 삭제 시 소속 학생 데이터가 함께 삭제됩니다.
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
