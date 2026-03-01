import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, RefreshCw, Download, FileUp, Award, Type, Plus, Minus, Users, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SeatingStudent, RouletteItem } from '../../types/seating';

interface RouletteProps {
  onClose: () => void;
  students: SeatingStudent[];
}

const VISIBLE_COUNT = 5;
const REPEAT_COUNT = 7;
const SPIN_DURATION = 5000;
const BETWEEN_SPIN_PAUSE = 1300;

const SLOT_COLORS = [
  { bg: '#fce4ec', text: '#880e4f' },  // 핑크
  { bg: '#fff9c4', text: '#f57f17' },  // 노랑
  { bg: '#e0f7fa', text: '#006064' },  // 하늘
  { bg: '#f3e5f5', text: '#6a1b9a' },  // 보라
  { bg: '#e0f2f1', text: '#004d40' },  // 민트
  { bg: '#fff3e0', text: '#e65100' },  // 피치
  { bg: '#ede7f6', text: '#4527a0' },  // 라벤더
  { bg: '#f1f8e9', text: '#33691e' },  // 라임
];

const CONFETTI_COLORS = ['#f472b6', '#facc15', '#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#c084fc', '#4ade80'];

const Roulette: React.FC<RouletteProps> = ({ onClose, students }) => {
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [subject, setSubject] = useState("오늘의 주인공 추첨");
  const [winnerCount, setWinnerCount] = useState(1);
  const [newItemText, setNewItemText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<RouletteItem[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<RouletteItem[]>([]);
  const runSpinCycleRef = useRef<(spinIdx: number, allWinners: RouletteItem[]) => void>(null!);

  const itemH = isMobile ? 64 : 88;
  const drumH = itemH * VISIBLE_COUNT;

  const confettiPieces = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })), []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    if (students.length > 0 && items.length === 0) {
      setItems(students.map(s => ({ id: s.id, text: s.name })));
    }
  }, [students]);

  const downloadRouletteTemplate = () => {
    const data = [["학번", "이름"], ["10101", "김철수"], ["10102", "이영희"]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "명단양식");
    XLSX.writeFile(wb, "룰렛_추첨_양식.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        const newItems: RouletteItem[] = data
          .slice(1)
          .filter(row => row && row[1])
          .map((row, index) => ({
            id: `r-${row[0] || index}-${Date.now()}`,
            text: `${row[0] ? `(${row[0]}) ` : ''}${row[1]}`.trim()
          }));
        if (newItems.length > 0) setItems(prev => [...prev, ...newItems]);
      } catch {
        alert("파일을 읽는 도중 오류가 발생했습니다.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setItems(prev => [...prev, { id: `manual-${Date.now()}`, text: newItemText.trim() }]);
    setNewItemText("");
  };

  runSpinCycleRef.current = (spinIdx: number, allWinners: RouletteItem[]) => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    const winner = allWinners[spinIdx];
    const winnerOrigIdx = currentItems.findIndex(i => i.id === winner.id);
    if (winnerOrigIdx === -1) return;

    const targetBlock = REPEAT_COUNT - 2;
    const winnerPosInExtended = targetBlock * currentItems.length + winnerOrigIdx;
    const centerOffset = Math.floor(VISIBLE_COUNT / 2);
    const targetY = -((winnerPosInExtended - centerOffset) * itemH);

    if (drumRef.current) {
      drumRef.current.style.transition = 'none';
      drumRef.current.style.transform = 'translateY(0px)';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (drumRef.current) {
          drumRef.current.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.1, 0.95, 0.2, 1)`;
          drumRef.current.style.transform = `translateY(${targetY}px)`;
        }
      });
    });

    setTimeout(() => {
      setWinners(prev => [...prev, winner]);

      if (spinIdx + 1 < allWinners.length) {
        setTimeout(() => {
          runSpinCycleRef.current(spinIdx + 1, allWinners);
        }, BETWEEN_SPIN_PAUSE);
      } else {
        setIsSpinning(false);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        audio.volume = 0.2;
        audio.play().catch(() => {});
      }
    }, SPIN_DURATION);
  };

  const startSpin = () => {
    if (isSpinning || items.length < winnerCount) {
      if (items.length < winnerCount)
        alert(`참여 항목 수(${items.length})가 당첨 인원(${winnerCount})보다 적습니다.`);
      return;
    }
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const allWinners = shuffled.slice(0, winnerCount);
    setWinners([]);
    setIsSpinning(true);
    runSpinCycleRef.current(0, allWinners);
  };

  const extendedItems = Array.from({ length: REPEAT_COUNT }, () => items).flat();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 font-sans overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white rounded-2xl p-4 sm:p-10 shadow-2xl flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-12 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto lg:overflow-hidden border border-slate-200">
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-6 p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-all z-50">
          <X className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
        </button>

        {/* 좌측: 슬롯 + START */}
        <div className="flex-[1.2] flex flex-col items-center justify-center space-y-4 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-5xl font-black tracking-tight mb-1 sm:mb-2"
              style={{ fontFamily: "'Jua', sans-serif", background: 'linear-gradient(135deg, #f472b6, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              행운의 룰렛
            </h2>
          </div>

          <div className="w-[240px] sm:w-[360px] lg:w-[420px]">
            <div className="relative">
              {/* 화살표 제거됨 - 글로우 하이라이트로 대체 */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl"
                style={{ height: `${drumH}px`, border: '2.5px solid rgba(99,102,241,0.2)', boxShadow: '0 8px 32px -4px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.06)' }}>
                {/* 중앙 하이라이트 밴드 - 글로우 */}
                <div className="absolute inset-x-0 pointer-events-none z-10"
                  style={{ top: `${Math.floor(VISIBLE_COUNT / 2) * itemH}px`, height: `${itemH}px`, backgroundColor: 'rgba(99,102,241,0.08)', borderTop: '2.5px solid rgba(99,102,241,0.4)', borderBottom: '2.5px solid rgba(99,102,241,0.4)', boxShadow: '0 0 20px rgba(99,102,241,0.15), inset 0 0 20px rgba(99,102,241,0.05)' }} />
                <div className="absolute top-0 inset-x-0 pointer-events-none z-10"
                  style={{ height: `${itemH * 1.2}px`, background: 'linear-gradient(to bottom, rgba(255,255,255,0.92), transparent)' }} />
                <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10"
                  style={{ height: `${itemH * 1.2}px`, background: 'linear-gradient(to top, rgba(255,255,255,0.92), transparent)' }} />

                <div ref={drumRef} className="absolute top-0 inset-x-0" style={{ willChange: 'transform' }}>
                  {extendedItems.length > 0 ? (
                    extendedItems.map((item, idx) => {
                      const originalIdx = idx % Math.max(items.length, 1);
                      const color = SLOT_COLORS[originalIdx % SLOT_COLORS.length];
                      return (
                        <div key={`${item.id}-${idx}`} className="flex items-center justify-center select-none px-4 sm:px-6"
                          style={{ height: `${itemH}px`, backgroundColor: color.bg }}>
                          <span className="text-lg sm:text-3xl lg:text-4xl font-black text-center leading-tight truncate w-full"
                            style={{ color: color.text }}>{item.text}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center text-slate-300 text-sm sm:text-lg font-bold bg-white"
                      style={{ height: `${drumH}px` }}>항목을 추가해주세요</div>
                  )}
                </div>
              </div>
            </div>

            {winners.length > 0 && isSpinning && (
              <div className="mt-3 sm:mt-5 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                {winners.map((w, i) => {
                  const originalIdx = items.findIndex(it => it.id === w.id);
                  const color = SLOT_COLORS[(originalIdx >= 0 ? originalIdx : i) % SLOT_COLORS.length];
                  return (
                    <span key={w.id} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-sm sm:text-lg shadow border"
                      style={{ backgroundColor: color.bg, color: color.text, borderColor: color.text + '44' }}>{w.text}</span>
                  );
                })}
              </div>
            )}
          </div>

          {isSpinning && (
            <p className="text-indigo-400 font-bold text-sm sm:text-lg animate-pulse">
              {winners.length + 1} / {winnerCount}번째 추첨 중...
            </p>
          )}

          <button onClick={startSpin} disabled={isSpinning || items.length < 1}
            className="w-full max-w-[280px] sm:max-w-[340px] py-3 sm:py-5 text-white rounded-xl shadow-lg transition-all font-black text-base sm:text-2xl tracking-widest disabled:opacity-30 active:scale-95 flex items-center justify-center uppercase"
            style={{ background: isSpinning ? '#6366f1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
            {isSpinning ? <RefreshCw className="w-5 h-5 sm:w-7 sm:h-7 animate-spin" /> : <><Sparkles className="w-5 h-5 sm:w-7 sm:h-7 mr-2 sm:mr-3" /> START</>}
          </button>
        </div>

        {/* 우측: 설정 패널 */}
        <div className="flex-1 flex flex-col space-y-3 sm:space-y-6 lg:shrink-0 lg:max-w-md">
          <div className="space-y-3 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-500"><Type className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[15px] sm:text-[18px] font-medium tracking-tight">주제</span></div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled={isSpinning}
                className="w-full px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] sm:text-[18px] font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" />
            </div>
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-500"><Users className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[15px] sm:text-[18px] font-medium tracking-tight">당첨 인원</span></div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))} disabled={isSpinning}
                  className="px-4 sm:px-6 py-2.5 sm:py-3.5 hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200 active:bg-slate-200 disabled:opacity-50"><Minus className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                <input type="number" min="1" max={items.length || 1} value={winnerCount} readOnly
                  className="flex-1 text-center bg-transparent text-[15px] sm:text-[18px] font-bold outline-none appearance-none cursor-default py-2.5 sm:py-3.5"
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
                <button onClick={() => setWinnerCount(Math.min(items.length || 1, winnerCount + 1))} disabled={isSpinning}
                  className="px-4 sm:px-6 py-2.5 sm:py-3.5 hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200 active:bg-slate-200 disabled:opacity-50"><Plus className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-500"><Plus className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[15px] sm:text-[18px] font-medium tracking-tight">직접 추가</span></div>
              <div className="flex gap-2">
                <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} disabled={isSpinning}
                  placeholder="항목명" className="flex-1 min-w-0 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] sm:text-[18px] font-bold shadow-sm outline-none placeholder:text-slate-300 disabled:opacity-50" />
                <button onClick={handleAddItem} disabled={isSpinning}
                  className="px-3 sm:px-6 bg-indigo-600 text-white rounded-xl font-black text-[14px] sm:text-[16px] hover:bg-indigo-700 transition-all flex items-center justify-center shadow-md active:scale-95 group disabled:opacity-50 shrink-0 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 group-hover:rotate-90 transition-transform" /> 추가
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button onClick={downloadRouletteTemplate} disabled={isSpinning}
              className="flex items-center justify-center py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 transition-all text-[14px] sm:text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-indigo-500" /> 양식 받기
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isSpinning}
              className="flex items-center justify-center py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 transition-all text-[14px] sm:text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <FileUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-indigo-500" /> 파일 업로드
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls" />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 border border-slate-200 rounded-xl min-h-[160px] sm:min-h-[200px]">
            <div className="px-3 sm:px-5 py-2 sm:py-3 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
              <h4 className="text-[15px] sm:text-[18px] font-medium text-slate-500">참여 항목 ({items.length})</h4>
              <button onClick={() => setItems([])} disabled={isSpinning} className="text-[12px] sm:text-[13px] font-bold text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50">전체 삭제</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-[13px] sm:text-[15px] font-bold text-slate-700 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                  <span className="truncate pr-2">{item.text}</span>
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={isSpinning}
                    className="text-slate-300 hover:text-rose-500 transition-all hover:scale-110 disabled:opacity-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8 sm:py-10">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-20" />
                  <p className="text-xs sm:text-sm font-bold opacity-40">항목을 추가해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 당첨 결과 오버레이 */}
        {winners.length > 0 && !isSpinning && (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl animate-in fade-in duration-500 p-6 sm:p-12 text-center overflow-hidden rounded-2xl">
            {/* 컨페티 */}
            {confettiPieces.map(piece => (
              <div
                key={piece.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${piece.left}%`,
                  top: '-20px',
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  backgroundColor: piece.color,
                  borderRadius: piece.size > 10 ? '50%' : '2px',
                  transform: `rotate(${piece.rotation}deg)`,
                  animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in infinite`,
                  willChange: 'transform',
                }}
              />
            ))}

            <Award className="w-16 h-16 sm:w-28 sm:h-28 text-amber-400 mb-4 sm:mb-8 animate-bounce" />
            <div className="flex flex-col items-center space-y-4 sm:space-y-6 mb-8 sm:mb-14 w-full max-w-4xl overflow-hidden relative z-10">
              <span className="text-xl sm:text-4xl font-bold text-slate-700 tracking-tight">{subject}</span>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6 py-3 sm:py-4 max-h-[45vh] overflow-y-auto w-full px-4">
                {winners.map((win, idx) => {
                  const originalIdx = items.findIndex(it => it.id === win.id);
                  const color = SLOT_COLORS[(originalIdx >= 0 ? originalIdx : idx) % SLOT_COLORS.length];
                  return (
                    <div key={win.id} className="animate-in zoom-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                      <h3
                        className={`${winners.length > 4 ? 'text-lg sm:text-3xl' : winners.length > 1 ? 'text-xl sm:text-5xl' : 'text-3xl sm:text-7xl'} font-black tracking-tighter px-6 sm:px-14 py-3 sm:py-7 rounded-2xl shadow-2xl border-b-4`}
                        style={{ backgroundColor: color.bg, color: color.text, borderColor: color.text + '33' }}
                      >
                        {win.text}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setWinners([])}
              className="relative z-10 px-14 sm:px-32 py-3 sm:py-6 bg-indigo-600 text-white rounded-xl font-black text-lg sm:text-3xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl">확인</button>
          </div>
        )}
      </div>

      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(calc(95vh + 20px)) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Roulette;
