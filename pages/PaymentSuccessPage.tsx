import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * TossPayments 결제 성공 콜백 페이지
 *
 * TossPayments → successUrl(/#/payment/success?paymentKey=...&orderId=...&amount=...) 으로 리다이렉트
 * → 이 페이지에서 서버(Edge Function) 호출 → 결제 최종 승인 + DB 업데이트
 */
const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제를 처리 중입니다...');
  const [plan, setPlan] = useState('');
  const [credits, setCredits] = useState(0);
  const calledRef = useRef(false);

  useEffect(() => {
    // 인증 초기화 대기 — loading 중에는 session을 알 수 없으므로 대기
    if (loading) return;

    // session 확정 후에만 중복 잠금 적용
    if (calledRef.current) return;

    const params = new URLSearchParams(location.search);
    const paymentKey = params.get('paymentKey');
    const orderId    = params.get('orderId');
    const amount     = params.get('amount');

    if (!paymentKey || !orderId || !amount) {
      calledRef.current = true;
      setStatus('error');
      setMessage('결제 파라미터가 올바르지 않습니다.');
      return;
    }

    if (!session) {
      setStatus('error');
      setMessage('로그인이 필요합니다. 잠시 후 다시 시도해 주세요.');
      return; // 잠금 안 함 — session 로드 후 재시도
    }

    calledRef.current = true;

    const confirmPayment = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const res = await fetch(`${supabaseUrl}/functions/v1/toss-payment-confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || '결제 승인에 실패했습니다.');
          return;
        }

        setStatus('success');
        setMessage('결제가 완료되었습니다!');
        setPlan(data.plan || '');
        setCredits(data.creditsAdded || 0);

      } catch (err) {
        setStatus('error');
        setMessage('서버 연결 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [location.search, session, loading]);

  return (
    <div className="max-w-md mx-auto mt-10 p-8 glass rounded-2xl shadow-xl border border-white/40 animate-fade-in text-center">
      {status === 'processing' && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={36} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">결제 처리 중</h2>
          <p className="text-slate-500 font-medium">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="text-emerald-500" size={44} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">결제 완료!</h2>
          <p className="text-slate-500 font-medium mb-6">
            <span className="font-black text-indigo-700 capitalize">{plan}</span> 플랜이 활성화되었습니다.
            <br />
            <span className="font-black text-emerald-600">{credits}크레딧</span>이 지급되었습니다.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all active:scale-95"
          >
            대시보드로 이동 <ArrowRight size={18} />
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertCircle className="text-rose-500" size={44} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">결제 실패</h2>
          <p className="text-slate-500 font-medium mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/pricing" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
              다시 시도
            </Link>
            <Link to="/" className="bg-slate-100 text-slate-500 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
              홈으로
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
