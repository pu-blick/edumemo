
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Classroom, Student, BatchResult } from '../types';
import { Zap, CheckCircle2, AlertCircle, Loader2, Copy, Search, FileDown, ArrowLeft, RefreshCw, CheckSquare, Square, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateStudentDraft } from '../services/geminiService';
import * as XLSX from 'xlsx';

const BatchGenerator: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const initialClassroomId = queryParams.get('classroomId') || '';

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroomId);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set<string>());
  const [charLimit, setCharLimit] = useState(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, BatchResult>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [studentSearch, setStudentSearch] = useState('');

  const fetchClassrooms = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('classrooms').select('*').order('created_at', { ascending: false });
    setClassrooms(data ?? []);
  }, [user]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    if (!selectedClassroom) { setStudents([]); setSelectedStudentIds(new Set()); return; }
    supabase
      .from('students')
      .select('*')
      .eq('classroom_id', selectedClassroom)
      .then(({ data }) => {
        const sorted = (data ?? []).sort((a, b) => a.student_number.localeCompare(b.student_number, undefined, { numeric: true }));
        setStudents(sorted);
        setSelectedStudentIds(new Set(sorted.map(s => s.id)));
      });
  }, [selectedClassroom]);

  const startBatchProcess = async () => {
    const targetIds: string[] = Array.from(selectedStudentIds);
    if (targetIds.length === 0) return alert('학생을 선택해 주세요.');
    setIsProcessing(true);
    setProgress({ current: 0, total: targetIds.length });

    const newResults = { ...batchResults };
    targetIds.forEach((sid: string) => { newResults[sid] = { studentId: sid, status: 'loading' }; });
    setBatchResults(newResults);

    for (let i = 0; i < targetIds.length; i++) {
      const sid: string = targetIds[i];
      setProgress(p => ({ ...p, current: i + 1 }));
      try {
        const student = students.find(s => s.id === sid);
        const { data: obsData } = await supabase
          .from('observations')
          .select('content')
          .eq('student_id', sid);
        const texts = (obsData ?? []).map(o => o.content);
        if (texts.length === 0) throw new Error('관찰 기록 없음');
        const res = await generateStudentDraft(student!.name, student!.student_number, texts, charLimit);
        setBatchResults(p => ({ ...p, [sid]: { studentId: sid, status: 'success', result: res } }));
      } catch (e: any) {
        setBatchResults(p => ({ ...p, [sid]: { studentId: sid, status: 'error', error: e.message } }));
      }
    }
    setIsProcessing(false);
  };

  const handleExportExcel = () => {
    const header = ['학번', '이름', '초안', '바이트 수(LENB)'];
    const exportData = students
      .filter(s => batchResults[s.id]?.status === 'success')
      .map((s, index) => {
        const rowNum = index + 2;
        return [s.student_number, s.name, batchResults[s.id].result || '', { f: `LENB(C${rowNum})` }];
      });
    const ws = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AI 생성 결과');
    XLSX.writeFile(wb, `${classrooms.find(c => c.id === selectedClassroom)?.name || '학급'}_AI_초안_결과.xlsx`);
  };

  const filteredStudents = students.filter(s => s.name.includes(studentSearch) || s.student_number.includes(studentSearch));
  const successCount = Object.values(batchResults).filter(r => r.status === 'success').length;
  const errorCount   = Object.values(batchResults).filter(r => r.status === 'error').length;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-2 pb-16">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link to={selectedClassroom ? `/classroom/${selectedClassroom}` : '/'} className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all mb-4 text-[13px]"><ArrowLeft size={16} /> 돌아가기</Link>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">생기부 일괄 작성</h1>
          <p className="text-slate-400 font-medium text-[13px] mt-1">선택된 학생들의 생활기록부 초안을 AI로 일괄 생성합니다.</p>
        </div>
      </div>

      {/* 학급 선택 */}
      <div className="mb-6 glass rounded-2xl p-6 border border-white shadow-md">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">학급 선택</label>
        <select
          className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-white font-bold text-base outline-none focus:border-indigo-500"
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
        >
          <option value="">-- 학급을 선택하세요 --</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClassroom && students.length > 0 && (
        <div className="mb-6 glass rounded-2xl p-6 border border-white shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              <span className="font-black text-slate-700">{selectedStudentIds.size}/{students.length}명 선택</span>
            </div>
            <button
              onClick={() => setSelectedStudentIds(selectedStudentIds.size === students.length ? new Set() : new Set(students.map(s => s.id)))}
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              {selectedStudentIds.size === students.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="학생 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-white font-medium text-sm outline-none"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
            {filteredStudents.map(s => {
              const result = batchResults[s.id];
              const isSelected = selectedStudentIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    const next = new Set(selectedStudentIds);
                    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                    setSelectedStudentIds(next);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border text-[13px] font-bold ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  <span className="truncate">{s.name}</span>
                  {result?.status === 'success' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                  {result?.status === 'error'   && <AlertCircle  size={12} className="text-rose-500 shrink-0" />}
                  {result?.status === 'loading' && <Loader2 size={12} className="animate-spin text-indigo-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 설정 및 실행 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-6 border border-white shadow-md">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">희망 분량</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[300, 500, 800].map(l => (
              <button key={l} onClick={() => setCharLimit(l)} className={`py-2.5 rounded-xl text-[12px] font-bold border transition-all ${charLimit === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>{l}자</button>
            ))}
          </div>
          <input type="number" className="w-full p-3 rounded-xl border border-slate-100 bg-white font-bold text-center focus:border-indigo-500 outline-none text-sm" value={charLimit} onChange={(e) => setCharLimit(parseInt(e.target.value) || 0)} />
        </div>

        <div className="glass rounded-2xl p-6 border border-white shadow-md flex flex-col justify-between">
          {isProcessing && (
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span>진행 중...</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
          {!isProcessing && successCount > 0 && (
            <div className="text-[11px] font-bold text-slate-400 mb-3">
              완료: <span className="text-emerald-600">{successCount}명 성공</span>
              {errorCount > 0 && <span className="text-rose-500 ml-2">{errorCount}명 실패</span>}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={startBatchProcess}
              disabled={isProcessing || selectedStudentIds.size === 0}
              className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black disabled:bg-slate-200 transition-all active:scale-95"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={18} /> 처리 중...</> : <><Zap size={18} className="fill-current" /> 일괄 생성</>}
            </button>
            {successCount > 0 && (
              <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-4 py-3 bg-emerald-500 text-white rounded-xl text-[12px] font-bold hover:bg-emerald-600 transition-all">
                <FileDown size={16} /> 엑셀
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      {Object.keys(batchResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">생성 결과</h3>
          {students
            .filter(s => batchResults[s.id])
            .map(s => {
              const result = batchResults[s.id];
              return (
                <div key={s.id} className={`glass-card rounded-2xl p-6 border ${result.status === 'success' ? 'border-emerald-100' : result.status === 'error' ? 'border-rose-100' : 'border-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' && <CheckCircle2 className="text-emerald-500" size={18} />}
                      {result.status === 'error'   && <AlertCircle  className="text-rose-500"    size={18} />}
                      {result.status === 'loading' && <Loader2 className="animate-spin text-indigo-500" size={18} />}
                      <span className="font-black text-slate-700">{s.student_number} {s.name}</span>
                    </div>
                    {result.status === 'success' && (
                      <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(result.result || ''); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"><Copy size={14} /></button>
                        <button onClick={() => setBatchResults(p => ({ ...p, [s.id]: { ...p[s.id], status: 'pending' } }))} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all"><RefreshCw size={14} /></button>
                      </div>
                    )}
                  </div>
                  {result.status === 'success' && (
                    <p className="text-slate-600 text-sm leading-relaxed font-medium bg-white/60 p-4 rounded-xl whitespace-pre-wrap">{result.result}</p>
                  )}
                  {result.status === 'error' && (
                    <p className="text-rose-500 text-[13px] font-bold">{result.error}</p>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default BatchGenerator;
