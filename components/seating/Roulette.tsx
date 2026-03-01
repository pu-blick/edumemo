import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, RefreshCw, Download, FileUp, Award, Type, Plus, Minus, Users, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SeatingStudent, RouletteItem } from '../../types/seating';

interface RouletteProps {
  onClose: () => void;
  students: SeatingStudent[];
}

const WHEEL_SPIN_DURATION = 5000;
const WHEEL_SPIN_MIN_ROTATIONS = 5;
const WHEEL_SPIN_MAX_ROTATIONS = 8;
const BETWEEN_SPIN_PAUSE = 1300;

const WHEEL_COLORS = [
  { bg: '#fce4ec', text: '#880e4f' },
  { bg: '#fff9c4', text: '#f57f17' },
  { bg: '#e0f7fa', text: '#006064' },
  { bg: '#f3e5f5', text: '#6a1b9a' },
  { bg: '#e0f2f1', text: '#004d40' },
  { bg: '#fff3e0', text: '#e65100' },
  { bg: '#ede7f6', text: '#4527a0' },
  { bg: '#f1f8e9', text: '#33691e' },
];

const CONFETTI_COLORS = ['#f472b6', '#facc15', '#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#c084fc', '#4ade80'];

function calculateFontSize(segmentCount: number, _radius: number, isMobile: boolean): number {
  const baseSize = isMobile ? 11 : 15;
  if (segmentCount <= 6) return baseSize;
  if (segmentCount <= 12) return Math.max(baseSize - 2, 9);
  if (segmentCount <= 20) return Math.max(baseSize - 4, 8);
  return Math.max(baseSize - 6, 7);
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(truncated + '..').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '..';
}

const Roulette: React.FC<RouletteProps> = ({ onClose, students }) => {
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [subject, setSubject] = useState("오늘의 주인공 추첨");
  const [winnerCount, setWinnerCount] = useState(1);
  const [newItemText, setNewItemText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<RouletteItem[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);

  const canvasSize = isMobile ? 280 : 400;

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

  useEffect(() => {
    if (students.length > 0 && items.length === 0) {
      setItems(students.map(s => ({ id: s.id, text: s.name })));
    }
  }, [students]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const drawWheel = useCallback((rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvasSize;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    const radius = center - 6;
    const segmentCount = items.length;

    ctx.clearRect(0, 0, size, size);

    // outer shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 3, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.restore();

    if (segmentCount === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f8f8f8';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${isMobile ? 13 : 17}px 'Noto Sans KR', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('항목을 추가해주세요', center, center);
      // center hub
      ctx.beginPath();
      ctx.arc(center, center, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#d97706';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(center, center, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      return;
    }

    const segmentAngle = (Math.PI * 2) / segmentCount;

    // draw segments
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = rotationAngle + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color.bg;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // draw text
    const fontSize = calculateFontSize(segmentCount, radius, isMobile);
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = rotationAngle + i * segmentAngle;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color.text;
      ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;

      const maxWidth = radius * 0.5;
      const displayText = truncateText(ctx, items[i].text, maxWidth);
      const textX = radius * 0.62;
      ctx.fillText(displayText, textX, 0);
      ctx.restore();
    }

    // outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.stroke();

    // inner ring
    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1;
    ctx.stroke();

    // tick marks on outer ring
    for (let i = 0; i < segmentCount; i++) {
      const angle = rotationAngle + i * segmentAngle;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * (radius - 12), center + Math.sin(angle) * (radius - 12));
      ctx.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // decorative dots on outer ring
    const dotCount = Math.max(segmentCount * 2, 16);
    for (let i = 0; i < dotCount; i++) {
      const angle = (Math.PI * 2 / dotCount) * i;
      const dotX = center + Math.cos(angle) * (radius + 0.5);
      const dotY = center + Math.sin(angle) * (radius + 0.5);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#fef2f2' : '#fecaca';
      ctx.fill();
    }

    // center hub
    ctx.beginPath();
    ctx.arc(center, center, isMobile ? 16 : 22, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, isMobile ? 9 : 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }, [items, isMobile, canvasSize]);

  // redraw on items/size change
  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // ensure font is loaded before first draw
  useEffect(() => {
    document.fonts.ready.then(() => {
      drawWheel(currentAngleRef.current);
    });
  }, [drawWheel]);

  const spinWheel = useCallback((winnerIndex: number, onComplete: () => void) => {
    const segmentCount = items.length;
    if (segmentCount === 0) return;

    const segmentAngle = (Math.PI * 2) / segmentCount;

    // pointer is at top = -PI/2
    // we want: rotation + winnerIndex * segmentAngle + segmentAngle/2 = -PI/2
    const baseTargetAngle = -Math.PI / 2 - winnerIndex * segmentAngle - segmentAngle / 2;
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;
    const targetAngle = baseTargetAngle + jitter;

    const extraRotations = WHEEL_SPIN_MIN_ROTATIONS + Math.random() * (WHEEL_SPIN_MAX_ROTATIONS - WHEEL_SPIN_MIN_ROTATIONS);
    const totalRotation = targetAngle - currentAngleRef.current - extraRotations * Math.PI * 2;

    const startAngle = currentAngleRef.current;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / WHEEL_SPIN_DURATION, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * eased;
      currentAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        currentAngleRef.current = (startAngle + totalRotation) % (Math.PI * 2);
        drawWheel(currentAngleRef.current);
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [items, drawWheel]);

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
    isSpinningRef.current = true;

    const runCycle = (spinIdx: number) => {
      const winner = allWinners[spinIdx];
      const winnerOrigIdx = items.findIndex(i => i.id === winner.id);

      spinWheel(winnerOrigIdx, () => {
        setWinners(prev => [...prev, winner]);

        if (spinIdx + 1 < allWinners.length) {
          setTimeout(() => {
            if (isSpinningRef.current) runCycle(spinIdx + 1);
          }, BETWEEN_SPIN_PAUSE);
        } else {
          setIsSpinning(false);
          isSpinningRef.current = false;
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          audio.volume = 0.2;
          audio.play().catch(() => {});
        }
      });
    };

    runCycle(0);
  };

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 font-sans overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto border border-slate-200">
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-6 p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-all z-50">
          <X className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
        </button>

        {/* 좌측: 원형 휠 + START */}
        <div className="flex-[1.2] flex flex-col items-center justify-center space-y-2 sm:space-y-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-5xl font-black tracking-tight mb-1 sm:mb-2"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
              행운의 룰렛
            </h2>
          </div>

          {/* 휠 컨테이너 */}
          <div className="relative" style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}>
            {/* 고정 포인터 (12시 방향) */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-10px' }}>
              <svg width={isMobile ? 28 : 36} height={isMobile ? 34 : 44} viewBox="0 0 36 44">
                <defs>
                  <filter id="pointer-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                  </filter>
                </defs>
                <polygon points="18,44 2,0 34,0" fill="#d97706" stroke="#92400e" strokeWidth="1.5" filter="url(#pointer-shadow)" />
                <polygon points="18,36 8,6 28,6" fill="#f59e0b" />
              </svg>
            </div>

            <canvas ref={canvasRef} className="rounded-full" />
          </div>

          {/* 진행 중 당첨자 표시 */}
          {winners.length > 0 && isSpinning && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {winners.map((w, i) => {
                const originalIdx = items.findIndex(it => it.id === w.id);
                const color = WHEEL_COLORS[(originalIdx >= 0 ? originalIdx : i) % WHEEL_COLORS.length];
                return (
                  <span key={w.id} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-sm sm:text-lg shadow border"
                    style={{ backgroundColor: color.bg, color: color.text, borderColor: color.text + '44' }}>{w.text}</span>
                );
              })}
            </div>
          )}

          {isSpinning && (
            <p className="text-amber-500 font-bold text-sm sm:text-lg animate-pulse">
              {winners.length + 1} / {winnerCount}번째 추첨 중...
            </p>
          )}

          <button onClick={startSpin} disabled={isSpinning || items.length < 1}
            className="w-full max-w-[280px] sm:max-w-[340px] py-3 sm:py-5 text-white rounded-xl shadow-lg transition-all font-black text-base sm:text-2xl tracking-widest disabled:opacity-30 active:scale-95 flex items-center justify-center uppercase"
            style={{
              background: isSpinning ? '#d97706' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 20px rgba(220,38,38,0.35)'
            }}>
            {isSpinning ? <RefreshCw className="w-5 h-5 sm:w-7 sm:h-7 animate-spin" /> : <><Sparkles className="w-5 h-5 sm:w-7 sm:h-7 mr-2 sm:mr-3" /> START</>}
          </button>
        </div>

        {/* 우측: 설정 패널 */}
        <div className="flex-1 flex flex-col space-y-3 sm:space-y-6 lg:shrink-0 lg:max-w-md">
          <div className="space-y-3 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-500"><Type className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[15px] sm:text-[18px] font-medium tracking-tight">주제</span></div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled={isSpinning}
                className="w-full px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] sm:text-[18px] font-bold shadow-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" />
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
                  className="px-3 sm:px-6 bg-amber-600 text-white rounded-xl font-black text-[14px] sm:text-[16px] hover:bg-amber-700 transition-all flex items-center justify-center shadow-md active:scale-95 group disabled:opacity-50 shrink-0 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 group-hover:rotate-90 transition-transform" /> 추가
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button onClick={downloadRouletteTemplate} disabled={isSpinning}
              className="flex items-center justify-center py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-amber-50 transition-all text-[14px] sm:text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-amber-500" /> 양식 받기
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isSpinning}
              className="flex items-center justify-center py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-amber-50 transition-all text-[14px] sm:text-[16px] font-bold text-slate-600 shadow-sm disabled:opacity-50">
              <FileUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-amber-500" /> 파일 업로드
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls" />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 border border-slate-200 rounded-xl min-h-[160px] sm:min-h-[200px]">
            <div className="px-3 sm:px-5 py-2 sm:py-3 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
              <h4 className="text-[15px] sm:text-[18px] font-medium text-slate-500">참여 항목 ({items.length})</h4>
              <button onClick={() => setItems([])} disabled={isSpinning} className="text-[12px] sm:text-[13px] font-bold text-amber-500 hover:text-amber-700 transition-colors disabled:opacity-50">전체 삭제</button>
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
                  const color = WHEEL_COLORS[(originalIdx >= 0 ? originalIdx : idx) % WHEEL_COLORS.length];
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
              className="relative z-10 px-14 sm:px-32 py-3 sm:py-6 bg-amber-600 text-white rounded-xl font-black text-lg sm:text-3xl hover:bg-amber-700 transition-all active:scale-95 shadow-xl">확인</button>
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
