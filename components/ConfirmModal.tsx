import React, { useContext } from 'react';
import { ConfirmContext } from '../hooks/useConfirm';

const ConfirmModal: React.FC = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx || !ctx.confirmState.visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => ctx.resolve(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-slate-700 font-semibold text-sm leading-relaxed mb-5 whitespace-pre-line">
          {ctx.confirmState.message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => ctx.resolve(false)}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => ctx.resolve(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-black transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
