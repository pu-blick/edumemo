import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Subscription, Credits } from '../types';
import { CreditCard, Zap, ShieldCheck, CheckCircle, Loader2, ArrowLeft, Star, Building2 } from 'lucide-react';

// ── TossPayments 플랜 정의 ──────────────────────────────────
const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 9900,
    credits: 100,
    features: ['AI 초안 100회/월', '모든 기기 동기화', '우선 지원', '배치 일괄 생성'],
    icon: Zap,
    color: 'indigo',
  },
  {
    id: 'school',
    name: 'School',
    price: 29900,
    credits: 500,
    features: ['AI 초안 500회/월', '학교 단위 관리', '전담 고객 지원', '배치 일괄 생성', '엑셀 일괄 내보내기'],
    icon: Building2,
    color: 'emerald',
    recommended: true,
  },
] as const;

const PricingPage: React.FC = () => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: sub }, { data: crd }] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase.from('credits').select('*').eq('user_id', user.id).single(),
      ]);
      setSubscription(sub);
      setCredits(crd);
      setIsLoading(false);
    };
    fetchData();

    // 결제 완료 후 실시간 구독 업데이트
    const channel = supabase
      .channel('pricing_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'credits',       filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handlePayment = async (planId: string, amount: number) => {
    if (!user || !session) return;
    setProcessingPlan(planId);

    try {
      // ① 고유 orderId 생성 (idempotency key)
      const orderId = `edumemo_${planId}_${Date.now()}`;

      // ② DB에 pending 주문 생성 (RLS: user_id = auth.uid())
      const { error: orderError } = await supabase.from('payment_orders').insert({
        user_id:  user.id,
        order_id: orderId,
        amount,
        plan:     planId,
        status:   'pending',
      });
      if (orderError) throw new Error('주문 생성 실패');

      // ③ TossPayments SDK 초기화
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string;
      if (!clientKey) {
        alert('TossPayments 클라이언트 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        setProcessingPlan(null);
        return;
      }

      // @tosspayments/tosspayments-sdk 동적 import
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id });

      // ④ 결제 요청 (성공/실패 시 URL로 이동)
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName: `Edumemo ${planId.charAt(0).toUpperCase() + planId.slice(1)} 구독`,
        successUrl: `${window.location.origin}/#/payment/success`,
        failUrl:    `${window.location.origin}/#/payment/fail`,
        customerEmail: user.email ?? undefined,
        customerName:  user.user_metadata?.full_name ?? undefined,
        card: { useEscrow: false, flowMode: 'DEFAULT' },
      });

    } catch (err: any) {
      console.error('Payment error:', err);
      if (err?.code !== 'USER_CANCEL') {
        alert(err?.message || '결제 요청 중 오류가 발생했습니다.');
      }
      setProcessingPlan(null);
    }
  };

  const isCurrentPlan = (planId: string) => subscription?.plan === planId && subscription?.status === 'active';
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all mb-4 text-[13px]">
          <ArrowLeft size={16} /> 돌아가기
        </Link>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-3">구독 및 크레딧</h1>
        <p className="text-slate-400 font-medium">AI 초안 생성 기능을 이용하려면 크레딧이 필요합니다.</p>
      </div>

      {/* 현재 플랜 상태 */}
      <div className="mb-10 p-6 glass rounded-2xl border border-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">현재 플랜</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-800 capitalize">{subscription?.plan ?? 'free'}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {subscription?.status ?? 'active'}
              </span>
            </div>
            {periodEnd && <p className="text-[11px] text-slate-400 mt-1">만료일: {periodEnd}</p>}
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-5 py-3 rounded-xl">
            <Zap size={20} className="text-indigo-600 fill-indigo-600" />
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">남은 크레딧</p>
              <p className="text-2xl font-black text-indigo-700">{credits?.amount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 무료 플랜 */}
      <div className="mb-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><ShieldCheck size={20} /></div>
            <div>
              <p className="font-black text-slate-700">Free</p>
              <p className="text-[12px] text-slate-400">기본 기능 + 가입 시 10크레딧 지급</p>
            </div>
          </div>
          {isCurrentPlan('free') && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><CheckCircle size={14} /> 현재 플랜</span>
          )}
        </div>
      </div>

      {/* 유료 플랜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.id);
          const isProcessing = processingPlan === plan.id;
          const colorMap = {
            indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
            emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
          };
          const colors = colorMap[plan.color];

          return (
            <div key={plan.id} className={`relative p-6 rounded-2xl border-2 shadow-md bg-white transition-all ${plan.recommended ? `${colors.border} shadow-lg` : 'border-slate-100'}`}>
              {plan.recommended && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 ${colors.bg} text-white text-[10px] font-black rounded-full flex items-center gap-1`}>
                  <Star size={10} className="fill-current" /> 추천
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${colors.light} ${colors.text}`}><Icon size={22} /></div>
                <div>
                  <p className="font-black text-xl text-slate-800">{plan.name}</p>
                  <p className="text-[12px] text-slate-400">{plan.credits}크레딧/월 지급</p>
                </div>
              </div>

              <p className="text-3xl font-black text-slate-800 mb-6">
                ₩{plan.price.toLocaleString()}<span className="text-base font-bold text-slate-400">/월</span>
              </p>

              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                    <CheckCircle size={14} className={colors.text} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePayment(plan.id, plan.price)}
                disabled={isCurrent || isProcessing || processingPlan !== null}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : `${colors.bg} text-white hover:opacity-90 shadow-md`}`}
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={18} /> 결제 중...</>
                ) : isCurrent ? (
                  <><CheckCircle size={18} /> 현재 플랜</>
                ) : (
                  <><CreditCard size={18} /> {plan.name} 시작하기</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
        <p className="text-[12px] text-slate-400 font-medium">
          결제는 TossPayments를 통해 안전하게 처리됩니다. 구독은 매월 자동 갱신되지 않으며, 수동 결제 방식입니다.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
