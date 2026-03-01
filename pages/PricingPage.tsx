import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Subscription, Credits } from '../types';
import { CheckCircle, Loader2, ArrowLeft, CreditCard, Zap, Mail } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const PLANS = [
  {
    id: 'pro',
    number: 'B',
    name: 'T-buff Basic',
    price: 9900,
    priceDisplay: '월 9,900원',
    color: 'amber' as const,
    credits: 200,
    isContact: false,
    features: [
      '관찰 기록 무제한 저장',
      'PC·모바일 실시간 동기화',
      '관찰 → 생기부 자동 전환',
      '학급 전체 생기부 일괄 작성',
      '일괄 작성 엑셀 다운로드',
      '음성 기록 지원',
      '클래스당 최대 50명',
      '클래스 최대 5개 운영',
    ],
  },
  {
    id: 'plus',
    number: 'P',
    name: 'T-buff Plus',
    price: 15900,
    priceDisplay: '월 15,900원',
    color: 'blue' as const,
    recommended: true,
    credits: 500,
    isContact: false,
    features: [
      '관찰 기록 무제한 저장',
      'PC·모바일 실시간 동기화',
      '관찰 → 생기부 자동 전환',
      '학급 전체 생기부 일괄 작성',
      '일괄 작성 엑셀 다운로드',
      '음성 기록 지원',
      '클래스당 최대 50명',
      '클래스 최대 15개 운영',
      '자동 데이터 백업 지원',
      '기능 업데이트 자동 적용',
    ],
    highlightFeatures: [
      '클래스 최대 15개 운영',
      '자동 데이터 백업 지원',
      '기능 업데이트 자동 적용',
    ] as readonly string[],
  },
  {
    id: 'school',
    number: 'S',
    name: 'School 플랜',
    price: 13900,
    priceDisplay: '1인당 월 13,900원',
    color: 'emerald' as const,
    credits: 999,
    isContact: true,
    features: [
      '관찰 기록 무제한 저장',
      'PC·모바일 실시간 동기화',
      '관찰 → 생기부 자동 전환',
      '학급 전체 생기부 일괄 작성',
      '일괄 작성 엑셀 다운로드',
      '음성 기록 지원',
      '클래스당 최대 50명',
      '클래스 최대 15개 운영',
      '자동 데이터 백업 지원',
      '기능 업데이트 자동 적용',
      '학교 단위 통합 데이터 백업',
      '관리자 전용 대시보드 지원',
      '30명 이상 사용 시 신청 가능',
      '50명 이상 도입 시 단가 협의',
    ],
    highlightFeatures: [
      '학교 단위 통합 데이터 백업',
      '관리자 전용 대시보드 지원',
      '30명 이상 사용 시 신청 가능',
      '50명 이상 도입 시 단가 협의',
    ] as readonly string[],
  },
] as const;

const COLOR = {
  amber:   { header: 'bg-amber-50',   dot: 'bg-amber-400',   check: 'text-amber-500',   btn: 'bg-amber-500 hover:bg-amber-600',   border: 'border-amber-200',   price: 'text-amber-600',   highlight: 'text-amber-700 font-bold'   },
  blue:    { header: 'bg-blue-50',    dot: 'bg-blue-500',    check: 'text-blue-500',    btn: 'bg-blue-600 hover:bg-blue-700',    border: 'border-blue-200',    price: 'text-blue-700',    highlight: 'text-blue-700 font-bold'    },
  emerald: { header: 'bg-emerald-50', dot: 'bg-emerald-500', check: 'text-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700', border: 'border-emerald-200', price: 'text-emerald-700', highlight: 'text-emerald-700 font-bold' },
};

const PricingPage: React.FC = () => {
  const { user, session } = useAuth();
  const showToast = useToast();
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
      const orderId = `edumemo_${planId}_${Date.now()}`;
      const { error: orderError } = await supabase.from('payment_orders').insert({
        user_id: user.id, order_id: orderId, amount, plan: planId, status: 'pending',
      });
      if (orderError) throw new Error('주문 생성 실패');

      const clientKey = (import.meta as any).env?.VITE_TOSS_CLIENT_KEY as string;
      if (!clientKey) {
        showToast('TossPayments 클라이언트 키가 설정되지 않았습니다.', 'error');
        setProcessingPlan(null);
        return;
      }
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id.replace(/-/g, '') });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName: `Edumemo ${planId} 구독`,
        successUrl: `${window.location.origin}/#/payment/success`,
        failUrl:    `${window.location.origin}/#/payment/fail`,
        customerEmail: user.email ?? undefined,
        customerName:  user.user_metadata?.full_name ?? undefined,
        card: { useEscrow: false, flowMode: 'DEFAULT' },
      });
    } catch (err: any) {
      if (err?.code !== 'USER_CANCEL') {
        showToast((err?.message || '결제 오류') + (err?.code ? ` [${err.code}]` : ''), 'error');
      }
      setProcessingPlan(null);
    }
  };

  const isCurrentPlan = (planId: string) => (subscription?.plan as string) === planId && subscription?.status === 'active';
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
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all mb-4 text-[13px]">
          <ArrowLeft size={16} /> 돌아가기
        </Link>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">구독 플랜</h1>
        <p className="text-sm sm:text-base text-slate-400 font-medium">선생님의 기록이 더 편해지는 플랜을 선택하세요.</p>
      </div>

      {/* 현재 플랜 상태 */}
      <div className="mb-8 p-5 glass rounded-2xl border border-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-slate-400 mb-1">현재 플랜</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-800 capitalize">
              {(subscription?.plan as string) === 'pro' ? 'T-buff Basic'
               : (subscription?.plan as string) === 'plus' ? 'T-buff Plus'
               : (subscription?.plan as string) === 'school' ? 'School 플랜'
               : 'Free'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {subscription?.status ?? 'active'}
            </span>
          </div>
          {periodEnd && <p className="text-[11px] text-slate-400 mt-0.5">만료일: {periodEnd}</p>}
        </div>
        <div className="flex items-center gap-2.5 bg-indigo-50 px-4 py-3 rounded-xl">
          <Zap size={18} className="text-indigo-600 fill-indigo-600" />
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">남은 크레딧</p>
            <p className="text-xl font-black text-indigo-700">{credits?.amount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* 플랜 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const c = COLOR[plan.color];
          const isCurrent = isCurrentPlan(plan.id);
          const isProcessing = processingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all
                ${isCurrent ? c.border : 'border-slate-100'}
                ${'recommended' in plan && plan.recommended ? 'md:-mt-3 md:shadow-xl' : ''}
              `}
            >
              {'recommended' in plan && plan.recommended && (
                <div className={`absolute top-0 inset-x-0 h-1 ${c.dot}`} />
              )}

              {/* 카드 헤더 */}
              <div className={`${c.header} px-5 pt-6 pb-5`}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[22px] font-black text-slate-800 leading-tight">{plan.name}</h3>
                      {'recommended' in plan && plan.recommended && (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 ${c.check}`}>추천</span>
                      )}
                    </div>
                    <p className={`text-[17px] font-black ${c.price}`}>{plan.priceDisplay}</p>
                  </div>
                  <span className={`w-9 h-9 rounded-full ${c.dot} text-white text-[15px] font-black flex items-center justify-center shrink-0 mr-2`}>
                    {plan.number}
                  </span>
                </div>
              </div>

              {/* 기능 목록 */}
              <div className="px-5 py-5 flex-1">
                <ul className="space-y-2.5">
                  {(plan.features as readonly string[]).map(f => {
                    const isHighlight = 'highlightFeatures' in plan && (plan.highlightFeatures as readonly string[]).includes(f);
                    return (
                      <li key={f} className={`flex items-start gap-2 text-[13px] leading-snug ${isHighlight ? c.highlight : 'text-slate-600 font-medium'}`}>
                        <CheckCircle size={14} className={`${c.check} shrink-0 mt-0.5`} />
                        {f}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* CTA 버튼 */}
              <div className="px-5 pb-5">
                {plan.isContact ? (
                  <a
                    href="mailto:admin@edumemo.com?subject=School 플랜 문의"
                    className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${c.btn}`}
                  >
                    <Mail size={16} /> 도입 문의하기
                  </a>
                ) : (
                  <button
                    onClick={() => handlePayment(plan.id, plan.price)}
                    disabled={isCurrent || isProcessing || processingPlan !== null}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50
                      ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : `${c.btn} text-white`}`}
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin" size={16} /> 결제 중...</>
                    ) : isCurrent ? (
                      <><CheckCircle size={16} /> 현재 플랜</>
                    ) : (
                      <><CreditCard size={16} /> 구독 시작하기</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 무료 플랜 안내 */}
      <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 text-[13px] font-black flex items-center justify-center">F</div>
          <div>
            <span className="font-black text-slate-600 text-sm block sm:inline">Free 플랜</span>
            <span className="text-[12px] text-slate-400 block sm:inline sm:ml-2 mt-0.5 sm:mt-0">가입 시 크레딧 10개 지급 · 클래스 1개, 클래스당 최대 3명</span>
          </div>
        </div>
        {(subscription?.plan === 'free' || !subscription?.plan) && (
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle size={13} /> 현재 플랜
          </span>
        )}
      </div>

      <p className="mt-5 text-center text-[11px] text-slate-400">
        결제는 TossPayments를 통해 안전하게 처리됩니다. 구독은 수동 결제 방식입니다.
      </p>
    </div>
  );
};

export default PricingPage;
