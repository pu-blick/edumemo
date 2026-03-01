
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Classroom } from '../types';
import { getPlanLimits } from '../lib/planLimits';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import {
  Plus, Trash2, ChevronRight, School, Loader2, Edit2,
  Smartphone, Monitor, Sparkles, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [connected, setConnected] = useState(true);

  const fetchClassrooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setClassrooms(data ?? []);
      setConnected(true);
    } else {
      setConnected(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) { setClassrooms([]); setIsLoading(false); return; }

    fetchClassrooms();

    // Realtime 구독 (RLS가 본인 데이터만 브로드캐스트)
    const channel = supabase
      .channel('classrooms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms' }, fetchClassrooms)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchClassrooms]);

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;

    // 플랜 한도 체크
    const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single();
    const limits = getPlanLimits(sub?.plan);
    if (classrooms.length >= limits.maxClasses) {
      showToast(`현재 플랜에서는 최대 ${limits.maxClasses}개의 클래스를 만들 수 있습니다. 플랜을 업그레이드하여 더 많은 클래스를 운영해 보세요.`, 'warning');
      return;
    }

    const { error } = await supabase
      .from('classrooms')
      .insert({ name: newClassName.trim(), user_id: user.id });

    if (!error) {
      setNewClassName('');
      setIsAdding(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      showToast('저장 실패', 'error');
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase
      .from('classrooms')
      .update({ name: editingName.trim() })
      .eq('id', id);
    if (!error) setEditingId(null);
    else showToast('수정 실패', 'error');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!await confirm(`'${name}' 삭제하시겠습니까?`)) return;
    await supabase.from('classrooms').delete().eq('id', id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
        <p className="text-slate-400 font-bold tracking-widest text-[8px] uppercase">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {showSuccess && (
        <div className="mb-6 p-4 bg-indigo-600 text-white rounded-lg shadow-md flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="shrink-0" />
            <div>
              <h3 className="font-bold text-xs">기록 동기화 완료</h3>
              <p className="text-[10px] opacity-90">데이터가 안전하게 저장되었습니다.</p>
            </div>
          </div>
          <CheckCircle size={18} className="opacity-40" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">내 클래스룸</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-slate-100 shadow-sm">
              <Monitor size={10} className="text-slate-400" />
              <span className={`w-1 h-1 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <Smartphone size={10} className="text-slate-400" />
            </div>
          </div>
          <p className="text-slate-400 font-medium text-[13px]">
            교사의 정성이 담긴 기록을 안전하게 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95 text-[13px]"
        >
          <Plus size={16} /> 클래스 추가
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-5 glass rounded-lg animate-slide-up border border-indigo-100">
          <form onSubmit={handleAddClassroom} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="클래스 이름 (예: 2학년 5반)"
              className="flex-grow px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-medium text-base"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold">저장</button>
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-5 py-2.5 rounded-lg font-bold">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classrooms.map(classroom => (
          <div key={classroom.id} className="glass-card rounded-lg px-5 py-3.5 group flex flex-col h-full border border-white">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <School size={18} />
              </div>
              <div className="flex gap-0.5">
                <button onClick={() => startEdit(classroom.id, classroom.name)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-all bg-slate-50 rounded-lg"><Edit2 size={12} /></button>
                <button
                  onClick={() => handleDelete(classroom.id, classroom.name)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {editingId === classroom.id ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border-2 border-indigo-100 bg-white font-bold text-lg outline-none"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(classroom.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">완료</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg font-bold text-xs">취소</button>
                </div>
              </div>
            ) : (
              <h2 className="text-[1.35rem] font-black text-slate-800 mb-1 tracking-tight flex-grow group-hover:text-indigo-600 transition-colors">{classroom.name}</h2>
            )}

            <div className="flex justify-end items-center mt-3 pt-2.5 border-t border-slate-50">
              <Link to={`/classroom/${classroom.id}`} className="flex items-center gap-1 text-indigo-600 font-bold hover:underline text-[11px]">
                Enter <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {classrooms.length === 0 && !isLoading && (
        <div className="py-24 text-center">
          <p className="text-slate-300 font-black text-xl tracking-tight">클래스룸을 추가해 시작하세요.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
