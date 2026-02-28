import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

/**
 * TossPayments 결제 실패/취소 콜백 페이지
 */
const PaymentFailPage: React.FC = () => {
  const location = useLocation();

  // ── URL 파라미터 파싱 (HashRouter + 앱결제 복귀 호환) ────
  let searchStr = location.search;
  if (!searchStr) {
    const hash = window.location.hash;
    searchStr = hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '';
  }
  if (!searchStr) {
    searchStr = window.location.search;
  }

  const params  = new URLSearchParams(searchStr);
  const code    = params.get('code')    || '';
  const message = params.get('message') || '결제가 취소되었습니다.';
  const orderId = params.get('orderId') || '';

  const isUserCancel = code === 'PAY_PROCESS_CANCELED';

  return (
    <div className="max-w-md mx-auto mt-10 p-8 glass rounded-2xl shadow-xl border border-white/40 animate-fade-in text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
          <XCircle className="text-rose-500" size={44} />
        </div>
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-2">
        {isUserCancel ? '결제 취소됨' : '결제 실패'}
      </h2>
      <p className="text-slate-500 font-medium mb-2">{message}</p>
      {code && !isUserCancel && (
        <p className="text-[11px] text-slate-300 font-mono mb-6">코드: {code}</p>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
        >
          <RefreshCw size={16} /> 다시 시도
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
        >
          <ArrowLeft size={16} /> 홈으로
        </Link>
      </div>
    </div>
  );
};

export default PaymentFailPage;
