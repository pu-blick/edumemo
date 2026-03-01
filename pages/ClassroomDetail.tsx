
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Classroom, Student } from '../types';
import { getPlanLimits } from '../lib/planLimits';
import { useToast } from '../hooks/useToast';
import {
  UserPlus, Search, ArrowLeft, Download, Trash2,
  User as UserIcon, Users, Zap, Loader2, ClipboardList, FileUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ClassroomDetail: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [obsCounts, setObsCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ number: '', name: '' });
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!classroomId) return;
    const [{ data: cls }, { data: studs }, { data: obs }] = await Promise.all([
      supabase.from('classrooms').select('*').eq('id', classroomId).single(),
      supabase.from('students').select('*').eq('classroom_id', classroomId).order('student_number'),
      supabase.from('observations').select('student_id').eq('classroom_id', classroomId),
    ]);

    if (cls) setClassroom(cls);
    if (studs) setStudents(studs.sort((a, b) => a.student_number.localeCompare(b.student_number, undefined, { numeric: true })));
    if (obs) {
      const counts: Record<string, number> = {};
      obs.forEach(o => { counts[o.student_id] = (counts[o.student_id] || 0) + 1; });
      setObsCounts(counts);
    }
    setIsLoading(false);
  }, [classroomId]);

  useEffect(() => {
    if (!user || !classroomId) return;
    fetchData();

    const channel = supabase
      .channel(`classroom_${classroomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students',     filter: `classroom_id=eq.${classroomId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'observations', filter: `classroom_id=eq.${classroomId}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, classroomId, fetchData]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !user || !classroomId) return;

    // 플랜 한도 체크
    const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single();
    const limits = getPlanLimits(sub?.plan);
    if (students.length >= limits.maxStudentsPerClass) {
      showToast(`이 플랜에서는 클래스당 최대 ${limits.maxStudentsPerClass}명까지 등록할 수 있습니다. 플랜을 업그레이드하여 더 많은 학생을 등록해 보세요.`, 'warning');
      return;
    }

    const { error } = await supabase.from('students').insert({
      student_number: newStudent.number.trim(),
      name: newStudent.name.trim(),
      classroom_id: classroomId,
      user_id: user.id,
    });
    if (!error) { setNewStudent({ number: '', name: '' }); setIsAdding(false); }
    else showToast('등록 실패', 'error');
  };

  const handleStudentListUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        const rows = data.slice(1).filter(r => r[0] && r[1]);

        // 플랜 한도 체크
        const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user!.id).single();
        const limits = getPlanLimits(sub?.plan);
        if (students.length + rows.length > limits.maxStudentsPerClass) {
          setUploadStatus({ type: 'error', message: `업로드 불가: 현재 ${students.length}명 + 업로드 ${rows.length}명 = ${students.length + rows.length}명으로 ${limits.maxStudentsPerClass}명 한도를 초과합니다.` });
          setIsUploading(false);
          e.target.value = '';
          return;
        }

        const inserts = rows.map(row => ({
          student_number: String(row[0]).trim(),
          name: String(row[1]).trim(),
          classroom_id: classroomId!,
          user_id: user.id,
        }));
        const { error } = await supabase.from('students').insert(inserts);
        if (error) throw error;
        setUploadStatus({ type: 'success', message: `${inserts.length}명 명단 업로드 완료` });
      } catch {
        setUploadStatus({ type: 'error', message: '업로드 실패' });
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleObservationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        const inserts: any[] = [];
        data.slice(1).forEach(row => {
          const sNum  = String(row[0] || '').trim();
          const sName = String(row[1] || '').trim();
          const target = students.find(s => s.student_number === sNum && s.name === sName);
          if (target) {
            row.slice(2).filter((c: any) => c && String(c).trim()).forEach((c: any) => {
              inserts.push({
                student_id: target.id,
                classroom_id: classroomId!,
                content: String(c).trim(),
                normalized_content: String(c).trim().replace(/\s+/g, ' '),
                user_id: user.id,
              });
            });
          }
        });
        const { error } = await supabase.from('observations').insert(inserts);
        if (error) throw error;
        setUploadStatus({ type: 'success', message: `${inserts.length}건의 기록이 업로드되었습니다.` });
      } catch {
        setUploadStatus({ type: 'error', message: '업로드 실패' });
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = (type: 'students' | 'observations') => {
    const headers = type === 'students' ? [['학번', '이름']] : [['학번', '이름', '관찰1', '관찰2', '관찰3']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '양식');
    XLSX.writeFile(wb, `${classroom?.name || '학급'}_${type === 'students' ? '명단' : '기록'}_양식.xlsx`);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`${name} 학생을 삭제할까요?`)) return;
    await supabase.from('students').delete().eq('id', id);
  };

  const filteredStudents = students.filter(s => s.name.includes(searchQuery) || s.student_number.includes(searchQuery));

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all mb-4 text-[13px]"><ArrowLeft size={16} /> 돌아가기</Link>

        <div className="flex flex-col gap-5">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">{classroom?.name || '학급 정보 로딩 중...'}</h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-xl border border-slate-100 shadow-sm">
              <Users size={18} className="text-slate-300" />
              <span className="text-[14px] font-black text-slate-400">{students.length}명</span>
            </div>
            {students.length > 0 && (
              <button onClick={() => navigate(`/batch?classroomId=${classroomId}`)} className="flex items-center gap-2 h-12 text-white font-black text-[14px] bg-indigo-600 px-6 rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                <Zap size={18} className="fill-current" /> 생기부 일괄 작성
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => downloadTemplate('students')} className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-300 hover:text-indigo-600 transition-all shrink-0" title="명단 양식 다운로드">
                <Download size={18} />
              </button>
              <label className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-10 sm:h-12 bg-white text-[#10B981] border border-slate-100 rounded-xl font-bold text-[12px] sm:text-[14px] shadow-sm cursor-pointer hover:bg-emerald-50 transition-colors">
                <UserPlus size={16} className="shrink-0" /> 명단 업로드
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleStudentListUpload} />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => downloadTemplate('observations')} className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-300 hover:text-indigo-600 transition-all shrink-0" title="기록 양식 다운로드">
                <Download size={18} />
              </button>
              <label className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-10 sm:h-12 bg-white text-[#4F46E5] border border-slate-100 rounded-xl font-bold text-[12px] sm:text-[14px] shadow-sm cursor-pointer hover:bg-indigo-50 transition-colors">
                <ClipboardList size={16} className="shrink-0" /> 기록 업로드
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleObservationUpload} />
              </label>
            </div>

            <button onClick={() => setIsAdding(true)} className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-5 h-10 sm:h-12 bg-[#1E293B] text-white rounded-xl font-bold text-[12px] sm:text-[14px] hover:bg-black transition-all shadow-md">
              <FileUp size={16} /> 직접 추가
            </button>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-up shadow-sm border border-white ${uploadStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <div className="font-bold text-sm">{uploadStatus.message}</div>
          <button onClick={() => setUploadStatus(null)} className="ml-auto text-[10px] font-bold underline opacity-80">닫기</button>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="font-bold text-base text-slate-800">데이터 처리 중...</p>
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        <input
          type="text"
          placeholder="학생 검색 (이름 또는 학번)..."
          className="pl-14 pr-6 py-4 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 w-full text-base font-medium border border-slate-50 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="mb-6 p-6 glass rounded-2xl animate-slide-up border border-indigo-100 shadow-lg">
          <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="학번" className="flex-[0.5] px-5 py-3 rounded-xl border border-slate-200 bg-white font-bold text-base outline-none focus:border-indigo-500" value={newStudent.number} onChange={(e) => setNewStudent({ ...newStudent, number: e.target.value })} />
            <input type="text" placeholder="이름" className="flex-1 px-5 py-3 rounded-xl border border-slate-200 bg-white font-bold text-base outline-none focus:border-indigo-500" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm">저장</button>
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-500 px-6 py-3 rounded-xl font-bold text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 pb-20">
        {filteredStudents.map(student => (
          <div key={student.id} className="relative group">
            <Link to={`/student/${student.id}`} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden h-[44px]">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <UserIcon size={14} />
              </div>
              <div className="flex items-center gap-2 overflow-hidden flex-grow">
                <span className="text-[11px] text-slate-400 font-bold shrink-0 leading-none">{student.student_number}</span>
                <span className="text-[15px] font-black text-slate-800 tracking-tight truncate leading-none">{student.name}</span>
              </div>
              {obsCounts[student.id] > 0 && (
                <div className="bg-[#EF4444] text-white text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm shrink-0">
                  {obsCounts[student.id]}
                </div>
              )}
              <button
                onClick={(e) => { e.preventDefault(); handleDeleteStudent(student.id, student.name); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white rounded-lg shadow-sm"
              >
                <Trash2 size={12} />
              </button>
            </Link>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && !isLoading && (
        <div className="py-40 text-center">
          <p className="text-slate-300 font-black text-2xl tracking-tight uppercase">학생을 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetail;
