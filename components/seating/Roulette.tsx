import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RefreshCw, Download, FileUp, Award, Type, Plus, Minus, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SeatingStudent, RouletteItem } from '../../types/seating';

interface RouletteProps {
  onClose: () => void;
  students: SeatingStudent[];
}

const ITEM_HEIGHT = 88;
const VISIBLE_COUNT = 5;
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const REPEAT_COUNT = 7;
const SPIN_DURATION = 5000;
const BETWEEN_SPIN_PAUSE = 1300;

const SLOT_COLORS = [
  { bg: '#d1fae5', text: '#064e3b' },
  { bg: '#a7f3d0', text: '#064e3b' },
  { bg: '#6ee7b7', text: '#065f46' },
  { bg: '#bbf7d0', text: '#14532d' },
  { bg: '#86efac', text: '#14532d' },
  { bg: '#ccfbf1', text: '#134e4a' },
  { bg: '#99f6e4', text: '#0f4c42' },
  { bg: '#dcfce7', text: '#166534' },
];

const Roulette: React.FC<RouletteProps> = ({ onClose, students }) => {
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [subject, setSubject] = useState("오늘의 주인공 추첨");
  const [winnerCount, setWinnerCount] = useState(1);
  const [newItemText, setNewItemText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<RouletteItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<RouletteItem[]>([]);
  const runSpinCycleRef = useRef<(spinIdx: number, allWinners: RouletteItem[]) => void>(null!);

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
    const targetY = -((winnerPosInExtended - centerOffset) * ITEM_HEIGHT);

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

      <div className="relative w-full max-w-6xl bg-white rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto lg:overflow-hidden border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-6 p-2 hover:bg-slate-100 rounded-full transition-all z-50">
          <X className="w-8 h-8 text-slate-400" />
        </button>

        <div className="flex-[1.2] flex flex-col items-center justify-center space-y-6 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2"
              style={{ background: 'linear-gradient(135deg, #1a4d2e, #2d7a4f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              행운의 룰렛
            </h2>
          </div>

          <div className="w-[280px] sm:w-[360px] lg:w-[420px]">
            <div className="relative">
              <div className="absolute -left-5 z-20 text-amber-400 text-3xl leading-none pointer-events-none"
                style={{ top: `${Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT + ITEM_HEIGHT / 2}px`, transform: 'translateY(-50%)' }}>▶</div>
              <div className="absolute -right-5 z-20 text-amber-400 text-3xl leading-none pointer-events-none"
                style={{ top: `${Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT + ITEM_HEIGHT / 2}px`, transform: 'translateY(-50%)' }}>◀</div>

              <div className="relative overflow-hidden rounded-2xl shadow-2xl"
                style={{ height: `${DRUM_HEIGHT}px`, border: '2.5px solid rgba(26,77,46,0.18)', boxShadow: '0 8px 32px -4px rgba(26,77,46,0.15), 0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="absolute inset-x-0 pointer-events-none z-10"
                  style={{ top: `${Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT}px`, height: `${ITEM_HEIGHT}px`, backgroundColor: 'rgba(251,191,36,0.13)', borderTop: '2px solid rgba(245,158,11,0.5)', borderBottom: '2px solid rgba(245,158,11,0.5)' }} />
                <div className="absolute top-0 inset-x-0 pointer-events-none z-10"
                  style={{ height: `${ITEM_HEIGHT * 1.2}px`, background: 'linear-gradient(to bottom, rgba(255,255,255,0.92), transparent)' }} />
                <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10"
                  style={{ height: `${ITEM_HEIGHT * 1.2}px`, background: 'linear-gradient(to top, rgba(255,255,255,0.92), transparent)' }} />

                <div ref={drumRef} className="absolute top-0 inset-x-0" style={{ willChange: 'transform' }}>
                  {extendedItems.length > 0 ? (
                    extendedItems.map((item, idx) => {
                      const originalIdx = idx % Math.max(items.length, 1);
                      const color = SLOT_COLORS[originalIdx % SLOT_COLORS.length];
                      return (
                        <div key={`${item.id}-${idx}`} className="flex items-center justify-center select-none px-6"
                          style={{ height: `${ITEM_HEIGHT}px`, backgroundColor: color.bg }}>
                          <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-center leading-tight truncate w-full"
                            style={{ color: color.text }}>{item.text}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center text-slate-300 text-lg font-bold bg-white"
                      style={{ height: `${DRUM_HEIGHT}px` }}>항목을 추가해주세요</div>
                  )}
                </div>
              </div>
            </div>

            {winners.length > 0 && isSpinning && (
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {winners.map((w, i) => {
                  const originalIdx = items.findIndex(it => it.id === w.id);
                  const color = SLOT_COLORS[(originalIdx >= 0 ? originalIdx : i) % SLOT_COLORS.length];
                  return (
                    <span key={w.id} className="px-4 py-2 rounded-lg font-black text-lg shadow border"
                      style={{ backgroundColor: color.bg, color: color.text, borderColor: color.text + '44' }}>{w.text}</span>
                  );
                })}
              </div>
            )}
          </div>

          {isSpinning && (
            <p className="text-slate-500 font-bold text-lg animate-pulse">
              {winners.length + 1} / {winnerCount}번째 추첨 중...
            </p>
          )}

          <button onClick={startSpin} disabled={isSpinning || items.length < 1}
            className="w-full max-w-[340px] py-4 sm:py-5 text-white rounded-xl shadow-lg transition-all font-black text-xl sm:text-2xl tracking-widest disabled:opacity-30 active:scale-95 flex items-center justify-center uppercase"
            style={{ background: isSpinning ? '#1a4d2e' : 'linear-gradient(135deg, #1a4d2e 0%, #2d7a4f 100%)', boxShadow: '0 4px 20px rgba(26,77,46,0.35)' }}>
            {isSpinning ? <RefreshCw className="w-7 h-7 animate-spin" /> : <><Play className="w-7 h-7 mr-3 fill-white" /> START</>}
          </button>
        </div>

        <div className="flex-1 flex flex-col space-y-6 lg:shrink-0 lg:max-w-md">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3 text-slate-500"><Type className="w-5 h-5" /><span className="text-[18px] font-medium tracking-tight">주제</span></div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled={isSpinning}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[18px] font-bold shadow-sm focus:ring-2 focus:ring-[#1a4d2e]/10 focus:border-[#1a4d2e] outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3 text-slate-500"><Users className="w-5 h-5" /><span className="text-[18px] font-medium tracking-tight">당첨 인원</span></div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))} disabled={isSpinning}
                  className="px-6 py-3.5 hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200 active:bg-slate-200 disabled:opacity-50"><Minus className="w-6 h-6" /></button>
                <input type="number" min="1" max={items.length || 1} value={winnerCount} readOnly
                  className="flex-1 text-center bg-transparent text-[18px] font-bold outline-none appearance-none cursor-default py-3.5"
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
                <button onClick={() => setWinnerCount(Math.min(items.length || 1, winnerCount + 1))} disabled={isSpinning}
                  className="px-6 py-3.5 hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200 active:bg-slate-200 disabled:opacity-50"><Plus className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3 text-slate-500"><Plus className="w-5 h-5" /><span className="text-[18px] font-medium tracking-tight">직접 추가</span></div>
              <div className="flex gap-2">
                <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} disabled={isSpinning}
                  placeholder="항목명" className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[18px] font-bold shadow-sm outline-none placeholder:text-slate-300 disabled:opacity-50" />
                <button onClick={handleAddItem} disabled={isSpinning}
                  className="px-6 bg-[#1a4d2e] text-white rounded-lg font-black text-[16px] hover:bg-[#143a23] transition-all flex items-center justify-center shadow-md active:scale-95 group disabled:opacity-50">
                  <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" /> 추가
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={downloadRouletteTemplate} disabled={isSpinning}
              className="flex items-center justify-center py-3.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <Download className="w-5 h-5 mr-2 text-[#1a4d2e]" /> 양식 받기
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isSpinning}
              className="flex items-center justify-center py-3.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <FileUp className="w-5 h-5 mr-2 text-[#1a4d2e]" /> 파일 업로드
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls" />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 border border-slate-200 rounded-xl min-h-[200px]">
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
              <h4 className="text-[18px] font-medium text-slate-500">참여 항목 ({items.length})</h4>
              <button onClick={() => setItems([])} disabled={isSpinning} className="text-[13px] font-bold text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50">전체 삭제</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white px-4 py-3 rounded-lg text-[15px] font-bold text-slate-700 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                  <span className="truncate pr-2">{item.text}</span>
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={isSpinning}
                    className="text-slate-300 hover:text-rose-500 transition-all hover:scale-110 disabled:opacity-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                  <Users className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm font-bold opacity-40">항목을 추가해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {winners.length > 0 && !isSpinning && (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-[#0a2617]/95 backdrop-blur-lg animate-in fade-in duration-500 p-8 sm:p-12 text-center">
            <Award className="w-20 h-20 sm:w-28 sm:h-28 text-yellow-400 mb-6 sm:mb-8 animate-bounce" />
            <div className="flex flex-col items-center space-y-6 mb-10 sm:mb-14 w-full max-w-4xl overflow-hidden">
              <span className="text-2xl sm:text-4xl font-bold text-white/90 tracking-tight">{subject}</span>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-4 max-h-[45vh] overflow-y-auto w-full px-4">
                {winners.map((win, idx) => (
                  <div key={win.id} className="animate-in zoom-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                    <h3 className={`${winners.length > 4 ? 'text-xl sm:text-3xl' : winners.length > 1 ? 'text-2xl sm:text-5xl' : 'text-4xl sm:text-7xl'} font-black text-[#1a4d2e] tracking-tighter px-8 sm:px-14 py-4 sm:py-7 bg-white rounded-xl shadow-2xl border-b-4 border-slate-200`}>
                      {win.text}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setWinners([])}
              className="px-20 sm:px-32 py-4 sm:py-6 bg-white text-[#1a4d2e] rounded-xl font-black text-xl sm:text-3xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl border-b-4 border-slate-200">확인</button>
          </div>
        )}
      </div>

      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default Roulette;
