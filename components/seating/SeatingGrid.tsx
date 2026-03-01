import React from 'react';
import { SeatingConfig, Seat } from '../../types/seating';
import { MousePointer2, X, Lock } from 'lucide-react';

interface SeatingGridProps {
  config: SeatingConfig;
  seatingPlan: Seat[];
  onSeatClick: (index: number) => void;
  isExcludeMode: boolean;
  isTeacherView: boolean;
  isShuffling?: boolean;
  isSecretMode?: boolean;
}

const SeatingGrid: React.FC<SeatingGridProps> = ({ config, seatingPlan, onSeatClick, isExcludeMode, isTeacherView, isShuffling, isSecretMode }) => {
  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r < config.rows; r++) {
      let rowSeats = seatingPlan.slice(r * config.cols, (r + 1) * config.cols);
      if (isTeacherView) rowSeats = [...rowSeats].reverse();
      rows.push(rowSeats);
    }
    const displayRows = isTeacherView ? [...rows].reverse() : rows;

    return (
      <div
        className="grid gap-1.5 sm:gap-6 w-full max-w-full place-items-center"
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
      >
        {displayRows.flat().map((seat) => {
          const actualIndex = seatingPlan.findIndex(s => s.id === seat.id);
          const studentInfo = seat.student?.name || "";
          const idMatch = studentInfo.match(/^\((.*?)\)\s*(.*)$/);
          const studentId = idMatch ? idMatch[1] : null;
          const studentName = idMatch ? idMatch[2] : studentInfo;
          const isExcluded = seat.isExcluded;

          return (
            <div
              key={seat.id}
              onClick={() => onSeatClick(actualIndex)}
              className={`
                relative rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform w-full
                ${isExcluded ? 'excluded-seat' : ''}
                ${isShuffling ? 'animate-pulse scale-95 opacity-60' : 'hover:scale-105 active:scale-95'}
                ${seat.isRevealed
                  ? 'bg-[#fcfaf7] border-[#8d6e63] shadow-lg reveal-anim z-10'
                  : 'bg-[#f0edea] border-slate-200 hover:border-slate-300 shadow-sm'}
                ${isExcluded
                  ? isExcludeMode
                    ? 'opacity-30 bg-slate-100 border-dashed border-slate-300 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                  : ''}
                aspect-[4/3] min-h-[50px]
              `}
            >
              {!isExcluded && (
                <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-3 rounded-t-lg opacity-90 ${seat.isRevealed ? 'bg-[#5d4037]' : 'bg-slate-300'}`}></div>
              )}

              {isExcluded ? (
                <div className="flex items-center justify-center">
                   <X className="w-4 h-4 sm:w-8 sm:h-8 text-slate-300" />
                </div>
              ) : seat.isRevealed ? (
                <div className="capture-seat-content flex flex-col items-center justify-center w-full h-full p-0.5 sm:p-4 text-center space-y-0 sm:space-y-0.5 overflow-hidden">
                  {studentId && (
                    <span className="capture-text-id font-medium text-black text-[9px] sm:text-sm lg:text-base leading-tight">
                      {studentId}
                    </span>
                  )}
                  <span className="capture-text-name font-black text-slate-900 text-[10px] sm:text-base lg:text-lg leading-tight truncate w-full px-0.5">
                    {studentName}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-40">
                  <span className="text-[11px] sm:text-sm font-black text-slate-400">{actualIndex + 1}</span>
                  {seat.student && <MousePointer2 className="w-3 h-3 sm:w-5 sm:h-5 mt-1 sm:mt-2 text-slate-300 animate-bounce" />}
                </div>
              )}

              {isSecretMode && seat.pinnedStudentId && !isExcluded && (
                <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-amber-400 rounded-full p-0.5 shadow-md z-20">
                  <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
              )}

              {!isExcluded && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 sm:h-2 rounded-b-lg transition-colors ${seat.isRevealed ? 'bg-[#3e2723]' : 'bg-slate-200'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center items-center py-4 px-2">
      <div className="w-full max-w-7xl">
        {renderGrid()}
      </div>
    </div>
  );
};

export default SeatingGrid;
