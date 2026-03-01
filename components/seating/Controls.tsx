import React from 'react';
import { SeatingConfig } from '../../types/seating';

interface ControlsProps {
  config: SeatingConfig;
  setConfig: React.Dispatch<React.SetStateAction<SeatingConfig>>;
  title: string;
  setTitle: (val: string) => void;
}

const Controls: React.FC<ControlsProps> = ({ config, setConfig, title, setTitle }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: Math.max(1, Math.min(10, parseInt(value) || 1))
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-tight">배치표 이름</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-indigo-500 outline-none text-sm font-bold transition-all shadow-inner placeholder:text-slate-300"
          placeholder="예: 우리 반 자리 배치"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-tight">가로 칸</label>
          <input
            type="number"
            name="cols"
            value={config.cols}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-indigo-500 outline-none text-sm font-bold transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-tight">세로 줄</label>
          <input
            type="number"
            name="rows"
            value={config.rows}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-indigo-500 outline-none text-sm font-bold transition-all shadow-inner"
          />
        </div>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mb-1">Current Capacity</p>
        <p className="text-lg font-black text-slate-700">
          총 <span className="text-indigo-600 font-black">{config.rows * config.cols}</span>석 <span className="text-slate-300 font-normal">/</span> {config.cols}x{config.rows}
        </p>
      </div>
    </div>
  );
};

export default Controls;
