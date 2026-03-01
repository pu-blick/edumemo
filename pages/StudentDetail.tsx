
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student, Observation } from '../types';
import {
  ArrowLeft, Plus, Trash2, Zap, Copy, Edit2, Check, X,
  History, User as UserIcon, Loader2, Mic, MicOff, FileDown, CheckSquare, Square, Key
} from 'lucide-react';
import { generateStudentDraft } from '../services/geminiService';
import { checkCredit, deductCredit } from '../services/creditService';
import { getUserApiKey, setUserApiKey, removeUserApiKey } from '../lib/byokStorage';
import * as XLSX from 'xlsx';
import { useToast } from '../hooks/useToast';

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const showToast = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedObsIds, setSelectedObsIds] = useState<Set<string>>(new Set());
  const [newObs, setNewObs] = useState('');
  const [charLimit, setCharLimit] = useState<number>(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [useByok, setUseByok] = useState(() => !!getUserApiKey());
  const [byokKey, setByokKey] = useState(() => getUserApiKey() || '');

  const sessionRef = useRef<any>(null);
  const liveTranscriptionRef = useRef('');
  const isRecordingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    const [{ data: stu }, { data: obs }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('observations').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    ]);
    if (stu) { setStudent(stu); setEditName(stu.name); setEditNumber(stu.student_number); }
    const obsData = obs ?? [];
    setObservations(obsData);
    setSelectedObsIds(new Set(obsData.map(o => o.id)));
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    if (!user || !studentId) return;
    fetchData();

    const channel = supabase
      .channel(`student_${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'observations', filter: `student_id=eq.${studentId}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, studentId, fetchData]);

  const handleUpdateStudentInfo = async () => {
    if (!editName.trim() || !editNumber.trim() || !student) return;
    const { error } = await supabase
      .from('students')
      .update({ name: editName.trim(), student_number: editNumber.trim() })
      .eq('id', student.id);
    if (!error) setIsEditingInfo(false);
    else showToast('수정 실패', 'error');
  };

  const handleAddObservation = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newObs.trim() || liveTranscription.trim();
    if (!content || !user || !student) return;
    await supabase.from('observations').insert({
      student_id: student.id,
      classroom_id: student.classroom_id,
      content,
      normalized_content: content.replace(/\s+/g, ' '),
      user_id: user.id,
    });
    setNewObs('');
    setLiveTranscription('');
  };

  const handleDeleteObservation = async (id: string) => {
    if (!confirm('기록을 삭제할까요?')) return;
    await supabase.from('observations').delete().eq('id', id);
  };

  const handleByokToggle = (enabled: boolean) => {
    setUseByok(enabled);
    if (!enabled) { removeUserApiKey(); setByokKey(''); }
  };

  const handleByokSave = (key: string) => {
    setByokKey(key);
    if (key.trim()) setUserApiKey(key);
    else removeUserApiKey();
  };

  const handleGenerateAI = async () => {
    const targetObs = observations.filter(o => selectedObsIds.has(o.id)).map(o => o.content);
    if (!student || targetObs.length === 0) { showToast('기록을 선택해 주세요.', 'warning'); return; }

    const userKey = useByok && byokKey.trim() ? byokKey.trim() : undefined;

    // BYOK 키 없으면 크레딧 확인
    if (!userKey) {
      const credit = await checkCredit();
      if (credit < 1) {
        showToast('크레딧이 부족합니다. 구독 플랜을 확인해 주세요.', 'error');
        return;
      }
    }

    setIsGenerating(true);
    setDraftResult('');
    try {
      const res = await generateStudentDraft(student.name, student.student_number, targetObs, charLimit, undefined, userKey);
      setDraftResult(res);

      // BYOK 키 없으면 크레딧 차감
      if (!userKey) {
        const result = await deductCredit();
        if (!result.success) console.warn('[Credit] 차감 실패:', result.message);
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const startVoiceRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { showToast('이 브라우저는 음성 인식을 지원하지 않습니다.', 'error'); return; }
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    liveTranscriptionRef.current = '';
    isRecordingRef.current = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      liveTranscriptionRef.current = transcript;
      setLiveTranscription(transcript);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };
    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsRecording(false);
      }
    };
    recognition.start();
    setIsRecording(true);
    sessionRef.current = recognition;
  };

  const stopVoiceRecording = () => {
    isRecordingRef.current = false;
    if (sessionRef.current) sessionRef.current.stop();
    setIsRecording(false);
    const finalText = liveTranscriptionRef.current;
    if (finalText) {
      setNewObs(p => p + (p ? '\n' : '') + finalText);
      setLiveTranscription('');
      liveTranscriptionRef.current = '';
    }
  };

  if (isLoading) return <div className="py-20 text-center font-bold"><Loader2 className="animate-spin mx-auto text-indigo-600" size={32} /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in max-w-6xl mx-auto px-2">
      <div className="lg:col-span-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to={`/classroom/${student?.classroom_id}`} className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg text-[13px]"><ArrowLeft size={16} /> 목록</Link>

          <div className="flex items-center gap-4 text-right">
            {isEditingInfo ? (
              <div className="flex flex-col gap-2 items-end animate-fade-in">
                <div className="flex gap-2">
                  <input type="text" className="px-3 py-1.5 rounded-lg border border-indigo-200 font-bold text-right outline-none w-20 text-sm" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} />
                  <input type="text" className="px-3 py-1.5 rounded-lg border border-indigo-200 font-bold text-right outline-none w-28 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleUpdateStudentInfo} className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"><Check size={12}/> 저장</button>
                  <button onClick={() => setIsEditingInfo(false)} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold text-[11px] flex items-center gap-1"><X size={12}/> 취소</button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{student?.student_number}</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{student?.name} 학생</h1>
                  <button onClick={() => setIsEditingInfo(true)} className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={16} /></button>
                </div>
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm"><UserIcon size={24} /></div>
              </>
            )}
          </div>
        </div>

        {/* 새 관찰 기록 입력 */}
        <div className="glass rounded-custom p-6 sm:p-8 mb-8 relative border border-white shadow-lg overflow-hidden">
          {isRecording && (
            <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in">
              <div className="flex gap-1.5 mb-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-2 h-10 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
              <button onClick={stopVoiceRecording} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95"><MicOff size={18} /> 받아쓰기 중지</button>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="text-indigo-600" size={20} /> 새 관찰 기록</h3>
            <button onClick={startVoiceRecording} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 text-xs transition-all"><Mic size={16} /> 음성 입력</button>
          </div>
          <textarea
            className="w-full h-32 p-5 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 font-medium text-base leading-relaxed transition-all placeholder:text-slate-300"
            placeholder="학생의 특징적인 모습을 기록해 주세요..."
            value={newObs}
            onChange={(e) => setNewObs(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <button onClick={handleAddObservation} className="bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-black active:scale-95 transition-all text-sm">기록 저장</button>
          </div>
        </div>

        {/* 관찰 타임라인 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><History size={16} /> 관찰 타임라인</h3>
            <button
              onClick={() => setSelectedObsIds(selectedObsIds.size === observations.length ? new Set() : new Set(observations.map(o => o.id)))}
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              {selectedObsIds.size === observations.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          {observations.map(obs => (
            <div
              key={obs.id}
              onClick={() => {
                const next = new Set(selectedObsIds);
                if (next.has(obs.id)) next.delete(obs.id); else next.add(obs.id);
                setSelectedObsIds(next);
              }}
              className={`glass-card rounded-xl p-6 flex gap-5 cursor-pointer border transition-all ${selectedObsIds.has(obs.id) ? 'border-indigo-200 bg-indigo-50/30' : 'border-transparent'}`}
            >
              <div className="shrink-0 mt-0.5">
                {selectedObsIds.has(obs.id) ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-slate-200" size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    {new Date(obs.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteObservation(obs.id); }}
                    className="text-slate-200 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-slate-700 font-medium text-base leading-relaxed">{obs.content}</p>
              </div>
            </div>
          ))}
          {observations.length === 0 && (
            <div className="py-16 text-center text-slate-300 font-black">
              관찰 기록이 없습니다. 위에서 첫 번째 기록을 추가하세요.
            </div>
          )}
        </div>
      </div>

      {/* AI 초안 생성 패널 */}
      <div className="lg:col-span-4">
        <div className="glass rounded-custom p-6 sm:p-8 sticky top-24 border border-white shadow-xl bg-white/40">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Zap className="text-indigo-600 fill-indigo-600" size={20} /> AI 초안 생성</h2>

          {/* BYOK API 키 설정 */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <button
              onClick={() => handleByokToggle(!useByok)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                <Key size={14} /> 내 API 키 사용
              </span>
              {useByok
                ? <span className="text-indigo-600 text-[11px] font-black">ON</span>
                : <span className="text-slate-300 text-[11px] font-black">OFF</span>}
            </button>
            {useByok && (
              <input
                type="password"
                className="mt-3 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Gemini API 키 입력"
                value={byokKey}
                onChange={(e) => handleByokSave(e.target.value)}
              />
            )}
            {useByok && byokKey.trim() && (
              <p className="mt-2 text-[10px] text-emerald-600 font-bold">내 키 사용 중 (크레딧 차감 없음)</p>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">희망 분량</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[300, 500, 800].map(l => (
                <button key={l} onClick={() => setCharLimit(l)} className={`py-2.5 rounded-xl text-[12px] font-bold border transition-all ${charLimit === l ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}>{l}자</button>
              ))}
            </div>
            <input type="number" className="w-full p-3 rounded-xl border border-slate-100 bg-white font-bold text-center focus:border-indigo-500 outline-none text-sm" value={charLimit} onChange={(e) => setCharLimit(parseInt(e.target.value) || 0)} />
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={isGenerating || selectedObsIds.size === 0}
            className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-black disabled:bg-slate-200 transition-all active:scale-95 mb-4"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={20} className="fill-current" /> 초안 작성 시작</>}
          </button>

          {draftResult && (
            <div className="mt-8 animate-slide-up">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">생성 결과</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(draftResult); showToast('복사되었습니다.', 'success'); }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const ws = XLSX.utils.aoa_to_sheet([['학생성명', '학번', 'AI초안'], [student?.name, student?.student_number, draftResult]]);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, '초안');
                      XLSX.writeFile(wb, `${student?.name}_초안.xlsx`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-600 shadow-sm transition-all"
                  >
                    <FileDown size={14} /> 엑셀
                  </button>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-white/90 border border-indigo-50 font-medium text-slate-700 text-sm leading-relaxed shadow-inner max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {draftResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
