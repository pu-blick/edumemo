import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SeatingStudent, Seat, SeatingConfig } from '../types/seating';
import { Classroom, Student } from '../types';
import SeatingGrid from '../components/seating/SeatingGrid';
import Controls from '../components/seating/Controls';
import StudentInput from '../components/seating/StudentInput';
import Roulette from '../components/seating/Roulette';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { Shuffle, Printer, LayoutGrid, Loader2, Disc, Eye, EyeOff, Users, Lock, ChevronDown } from 'lucide-react';

const SeatingPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  // ── 학급 연동 상태 ─────────────────────────────
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  // ── 자리배치 핵심 상태 ──────────────────────────
  const [students, setStudents] = useState<SeatingStudent[]>([]);
  const [config, setConfig] = useState<SeatingConfig>({ rows: 5, cols: 6 });
  const [seatingPlan, setSeatingPlan] = useState<Seat[]>([]);
  const [isAllRevealed, setIsAllRevealed] = useState(false);
  const [isExcludeMode, setIsExcludeMode] = useState(false);
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [title, setTitle] = useState("우리 반 자리 배치");
  const [showRoulette, setShowRoulette] = useState(false);
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [selectedSecretStudent, setSelectedSecretStudent] = useState<SeatingStudent | null>(null);
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── 학급 목록 로드 ─────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('classrooms')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClassrooms(data || []);
        setLoadingClassrooms(false);
      });
  }, [user]);

  // ── 학급 선택 시 학생 로드 ──────────────────────
  useEffect(() => {
    if (!selectedClassroomId) return;
    supabase
      .from('students')
      .select('*')
      .eq('classroom_id', selectedClassroomId)
      .order('student_number')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const converted: SeatingStudent[] = (data as Student[]).map(s => ({
            id: s.id,
            name: s.student_number ? `(${s.student_number}) ${s.name}` : s.name,
          }));
          setStudents(converted);
          // 학급 이름으로 타이틀 자동 설정
          const cls = classrooms.find(c => c.id === selectedClassroomId);
          if (cls) setTitle(`${cls.name} 자리 배치`);
        }
      });
  }, [selectedClassroomId, classrooms]);

  // ── 그리드 초기화 ──────────────────────────────
  useEffect(() => {
    const totalSeats = config.rows * config.cols;
    const newPlan: Seat[] = Array.from({ length: totalSeats }, (_, i) => ({
      id: i,
      student: null,
      isRevealed: false,
      isExcluded: false,
      pinnedStudentId: null,
    }));
    setSeatingPlan(newPlan);
    setIsAllRevealed(false);
  }, [config]);

  // ── 로고 5회 클릭 → 비밀 고정 모드 ──────────────
  const handleLogoClick = () => {
    logoClickCountRef.current += 1;
    if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
    logoClickTimerRef.current = setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 2000);
    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
      setIsSecretMode(prev => !prev);
      setSelectedSecretStudent(null);
    }
  };

  // ── 셔플 ────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (students.length === 0) {
      toast("학생 명단을 먼저 입력해주세요!", "error");
      return;
    }

    const availableSeats = seatingPlan.filter(s => !s.isExcluded).length;
    if (students.length > availableSeats) {
      toast(`자리가 부족합니다! 학생 ${students.length}명 / 좌석 ${availableSeats}석`, "error");
      return;
    }

    setIsShuffling(true);
    setTimeout(() => {
      const studentMap = new Map(students.map(s => [s.id, s]));
      const pinnedStudentIds = new Set(
        seatingPlan
          .filter(s => !s.isExcluded && s.pinnedStudentId && studentMap.has(s.pinnedStudentId))
          .map(s => s.pinnedStudentId!)
      );
      const remainingStudents = [...students]
        .filter(s => !pinnedStudentIds.has(s.id))
        .sort(() => Math.random() - 0.5);
      let remainingIndex = 0;

      const newPlan: Seat[] = seatingPlan.map(seat => {
        if (seat.isExcluded) return { ...seat, student: null, isRevealed: false };
        if (seat.pinnedStudentId && studentMap.has(seat.pinnedStudentId)) {
          return { ...seat, student: studentMap.get(seat.pinnedStudentId)!, isRevealed: false };
        }
        const student = remainingStudents[remainingIndex] || null;
        remainingIndex++;
        return { ...seat, student, isRevealed: false };
      });

      setSeatingPlan(newPlan);
      setIsAllRevealed(false);
      setIsShuffling(false);
    }, 1200);
  }, [students, seatingPlan, toast]);

  // ── 좌석 클릭 ──────────────────────────────────
  const handleSeatClick = (index: number) => {
    if (isExcludeMode) {
      setSeatingPlan(prev => prev.map((seat, i) =>
        i === index ? { ...seat, isExcluded: !seat.isExcluded, student: null } : seat
      ));
    } else if (isSecretMode) {
      if (seatingPlan[index]?.isExcluded) return;
      if (selectedSecretStudent) {
        setSeatingPlan(prev => prev.map((seat, i) => {
          if (i === index) {
            const newPin = seat.pinnedStudentId === selectedSecretStudent.id ? null : selectedSecretStudent.id;
            return { ...seat, pinnedStudentId: newPin };
          }
          if (seat.pinnedStudentId === selectedSecretStudent.id) return { ...seat, pinnedStudentId: null };
          return seat;
        }));
      } else {
        setSeatingPlan(prev => prev.map((seat, i) =>
          i === index ? { ...seat, pinnedStudentId: null } : seat
        ));
      }
    } else {
      setSeatingPlan(prev => {
        const newPlan = [...prev];
        if (newPlan[index].student) {
          newPlan[index] = { ...newPlan[index], isRevealed: !newPlan[index].isRevealed };
        }
        return newPlan;
      });
    }
  };

  // ── 이미지 내보내기 ────────────────────────────
  const handleExportImage = async () => {
    if (!printRef.current) return;

    if (!isAllRevealed) {
      if (await confirm("모든 이름을 공개한 상태로 이미지를 저장할까요?")) {
        setSeatingPlan(prev => prev.map(s => ({ ...s, isRevealed: true })));
        setIsAllRevealed(true);
      }
    }

    setTimeout(async () => {
      try {
        const target = printRef.current!;
        target.classList.add('capture-mode');

        const htmlToImage = await import('html-to-image');
        const dataUrl = await htmlToImage.toPng(target, {
          backgroundColor: '#f8f5f2',
          pixelRatio: 3,
        });

        target.classList.remove('capture-mode');

        const link = document.createElement('a');
        link.download = `${title || '자리배치'}_${new Date().toLocaleDateString()}.png`;
        link.href = dataUrl;
        link.click();
        toast("이미지가 저장되었습니다.");
      } catch (err) {
        console.error(err);
        toast("이미지 저장 중 오류가 발생했습니다.", "error");
        if (printRef.current) printRef.current.classList.remove('capture-mode');
      }
    }, 200);
  };

  // ── 칠판 컴포넌트 ─────────────────────────────
  const Blackboard = ({ isBottom = false }: { isBottom?: boolean }) => (
    <div className={`w-full max-w-4xl h-10 sm:h-14 bg-[#0a2e1f] rounded-lg sm:rounded-xl relative flex items-center justify-center border-[4px] sm:border-[8px] border-[#4e342e] shadow-xl shrink-0 overflow-hidden ${isBottom ? 'mt-8 sm:mt-16 mb-2 sm:mb-4' : 'mt-2 sm:mt-4 mb-8 sm:mb-16'}`}>
      <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 flex space-x-1 sm:space-x-2">
        <div className="w-4 h-1.5 sm:w-6 sm:h-2.5 bg-white/30 rounded-full"></div>
        <div className="w-6 h-1.5 sm:w-8 sm:h-2.5 bg-yellow-200/30 rounded-full"></div>
      </div>
      <div className="text-white font-black text-sm sm:text-xl tracking-[0.3em] sm:tracking-[0.5em] z-10 drop-shadow-lg uppercase">Blackboard</div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
    </div>
  );

  return (
    <div className="flex flex-col overflow-x-hidden text-slate-800 font-sans animate-fade-in" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* ── 헤더: 학급 선택 + 액션 버튼 ──────────── */}
      <header className="no-print shrink-0 px-4 sm:px-8 py-3 sm:py-5 flex flex-col sm:flex-row items-center justify-between border-b bg-white rounded-t-2xl shadow-sm z-10 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-5 self-start sm:self-center">
          <div onClick={handleLogoClick} className="p-1.5 sm:p-2.5 bg-indigo-600 rounded-lg sm:rounded-xl shadow-lg shadow-slate-200 cursor-pointer select-none shrink-0">
            <LayoutGrid className="text-white w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-extrabold sm:font-black tracking-tight text-slate-900 leading-none" style={{ WebkitTextStroke: '0.5px' }}>자리배치 도우미</h1>
              {isSecretMode && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 시크릿
                </span>
              )}
            </div>
            {/* 학급 선택 드롭다운 */}
            <div className="relative">
              {loadingClassrooms ? (
                <p className="text-[9px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest">Loading...</p>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedClassroomId}
                    onChange={e => setSelectedClassroomId(e.target.value)}
                    className="text-[11px] sm:text-[13px] text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 pr-6 outline-none focus:border-indigo-400 appearance-none cursor-pointer"
                  >
                    <option value="">수동 입력 모드</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="text-slate-400 -ml-5 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <button onClick={() => setShowRoulette(true)} className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 bg-white text-rose-600 rounded-lg sm:rounded-xl hover:bg-rose-50 transition-all text-xs sm:text-sm font-medium sm:font-bold border border-slate-100 shadow-sm active:scale-95">
            <Disc className="w-4 h-4 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" /> <span className="whitespace-nowrap">룰렛 추첨</span>
          </button>
          <button onClick={handleExportImage} className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all text-xs sm:text-sm font-medium sm:font-bold shadow-sm active:scale-95">
            <Printer className="w-4 h-4 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" /> <span className="whitespace-nowrap">이미지 저장</span>
          </button>
          <button onClick={handleShuffle} disabled={isShuffling} className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-8 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 transition-all shadow-xl text-xs sm:text-sm font-medium sm:font-bold disabled:opacity-50 active:scale-95">
            {isShuffling ? <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 mr-1.5 sm:mr-3 animate-spin" /> : <Shuffle className="w-4 h-4 sm:w-6 sm:h-6 mr-1.5 sm:mr-3" />}
            <span className="whitespace-nowrap">배치 시작</span>
          </button>
        </div>
      </header>

      {/* ── 메인 영역 ─────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row p-3 sm:p-6 gap-4 sm:gap-6">
        {/* 사이드바 */}
        <aside className="no-print w-full lg:w-80 flex flex-col shrink-0 gap-4 sm:gap-6">
          <section className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
            <h2 className="text-[12px] sm:text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Settings</h2>
            <Controls config={config} setConfig={setConfig} title={title} setTitle={setTitle} />

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="block text-[10px] sm:text-[12px] font-black text-slate-300 uppercase tracking-widest">Operation Mode</label>
                <div className="grid grid-cols-2 bg-slate-50 p-1 rounded-lg sm:rounded-xl border border-slate-200">
                  <button onClick={() => setIsExcludeMode(false)} className={`flex items-center justify-center py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-bold transition-all ${!isExcludeMode ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400'}`}>
                    배치 모드
                  </button>
                  <button onClick={() => setIsExcludeMode(true)} className={`flex items-center justify-center py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-bold transition-all ${isExcludeMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                    제외 모드
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] sm:text-[12px] font-black text-slate-300 uppercase tracking-widest">View Option</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <button
                    onClick={() => setIsTeacherView(!isTeacherView)}
                    className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-[12px] sm:text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                  >
                    <div className="flex items-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-slate-300 group-hover:text-indigo-600" />
                      {isTeacherView ? "교사 시점" : "학생 시점"}
                    </div>
                    <span className="text-[8px] sm:text-[10px] bg-slate-100 px-1.5 sm:py-0.5 rounded-full text-slate-400 font-black tracking-tighter">{isTeacherView ? "REAR" : "FRONT"}</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextState = !isAllRevealed;
                      setSeatingPlan(prev => prev.map(s => ({ ...s, isRevealed: nextState })));
                      setIsAllRevealed(nextState);
                    }}
                    className="flex items-center px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-[12px] sm:text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm group"
                  >
                    {isAllRevealed ? (
                      <><EyeOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-slate-400" /> 전체 가리기</>
                    ) : (
                      <><Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-indigo-600" /> 결과 공개</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 비밀 고정 모드 패널 */}
          {isSecretMode && (
            <section className="bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-sm">
              <h2 className="text-[12px] sm:text-[14px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Secret Pin Mode
              </h2>
              <p className="text-[10px] sm:text-[11px] text-amber-700 mb-2">학생 선택 후 자리 클릭 → 핀 고정</p>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {students.map(student => {
                  const isPinned = seatingPlan.some(s => s.pinnedStudentId === student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedSecretStudent(prev => prev?.id === student.id ? null : student)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all flex items-center justify-between ${
                        selectedSecretStudent?.id === student.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-amber-100 border border-amber-100'
                      }`}
                    >
                      <span>{student.name}</span>
                      {isPinned && <Lock className="w-2.5 h-2.5 shrink-0 opacity-60" />}
                    </button>
                  );
                })}
              </div>
              {selectedSecretStudent && (
                <p className="mt-2 text-[10px] text-amber-700 font-bold">✓ {selectedSecretStudent.name} 선택됨</p>
              )}
            </section>
          )}

          {/* 학생 명단 (수동 입력/엑셀 - 학급 미선택 시) */}
          {!selectedClassroomId && (
            <section className="bg-white rounded-xl sm:rounded-2xl flex-1 flex flex-col min-h-0 border border-slate-200 p-4 sm:p-5 shadow-sm">
              <h2 className="text-[12px] sm:text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Student List</h2>
              <StudentInput students={students} setStudents={setStudents} />
            </section>
          )}

          {/* 학급 연동 시 학생 목록 표시 */}
          {selectedClassroomId && (
            <section className="bg-white rounded-xl sm:rounded-2xl flex-1 flex flex-col min-h-0 border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] sm:text-[14px] font-black text-slate-400 uppercase tracking-[0.2em]">Student List</h2>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{students.length}명</span>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {students.map((s, i) => (
                  <div key={s.id} className="flex items-center px-3 py-1.5 bg-slate-50 rounded-lg text-[12px] font-medium text-slate-600">
                    <span className="text-slate-300 mr-2 text-[10px] font-bold">{i + 1}</span>
                    {s.name}
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-[11px] text-slate-400 text-center py-4">등록된 학생이 없습니다.</p>
                )}
              </div>
            </section>
          )}
        </aside>

        {/* 자리배치 그리드 영역 */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden rounded-xl sm:rounded-2xl bg-[#f8f5f2] shadow-xl shadow-slate-200/50 border border-slate-200">
          <div className="flex-1 overflow-auto lg:overflow-hidden p-4 sm:p-8 flex flex-col items-center justify-center">
            <div ref={printRef} className="w-full h-full flex flex-col items-center justify-center bg-[#f8f5f2] rounded-xl py-4">
              <h2 className="text-xl sm:text-[2.2rem] font-extrabold sm:font-black text-slate-900 mb-4 sm:mb-8 shrink-0 tracking-tight text-center px-4" style={{ WebkitTextStroke: '1.5px' }}>{title}</h2>

              {!isTeacherView && <Blackboard />}

              <div className="flex-1 w-full flex items-center justify-center min-h-0 px-2 sm:px-4 py-2">
                <SeatingGrid
                  config={config}
                  seatingPlan={seatingPlan}
                  onSeatClick={handleSeatClick}
                  isExcludeMode={isExcludeMode}
                  isTeacherView={isTeacherView}
                  isShuffling={isShuffling}
                  isSecretMode={isSecretMode}
                />
              </div>

              {isTeacherView && <Blackboard isBottom={true} />}

              <div className="h-4 sm:h-6 w-full" />
            </div>
          </div>
        </div>
      </main>

      {/* 룰렛 모달 */}
      {showRoulette && <Roulette onClose={() => setShowRoulette(false)} students={students} />}
    </div>
  );
};

export default SeatingPage;
