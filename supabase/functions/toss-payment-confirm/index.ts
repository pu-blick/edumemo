/**
 * TossPayments 결제 승인 Edge Function
 *
 * 클라이언트 → 이 함수 → TossPayments API → DB 업데이트
 *
 * 보안 원칙:
 * - TOSS_SECRET_KEY 는 이 서버(Edge Function)에서만 사용
 * - JWT 검증으로 인증된 사용자만 호출 가능
 * - order_id UNIQUE 제약 + 행 잠금으로 중복 처리 방지
 * - CORS: 허용된 도메인만 접근 가능 (와일드카드 * 제거)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 허용된 CORS 출처 (운영 + 로컬 개발) ───────────────────────
const ALLOWED_ORIGINS = [
  'https://tranquil-beignet-7e6187.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCORSHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCORSHeaders(req);

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405, corsHeaders);
  }

  try {
    // ── 1. 환경변수 ──────────────────────────────────────────
    const TOSS_SECRET_KEY           = Deno.env.get('TOSS_SECRET_KEY');
    const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TOSS_SECRET_KEY) {
      console.error('TOSS_SECRET_KEY is not set');
      return json({ error: '서버 설정 오류' }, 500, corsHeaders);
    }

    // ── 2. JWT 검증 → 인증된 사용자 확인 ────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: '인증이 필요합니다.' }, 401, corsHeaders);
    }
    const accessToken = authHeader.replace('Bearer ', '');

    // service_role 키로 토큰 검증 (sb_publishable_ 형식의 anon key는 JWT 검증에 사용 불가)
    const verifyClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('JWT verify error:', authError?.message);
      return json({ error: '유효하지 않은 인증 토큰입니다.' }, 401, corsHeaders);
    }

    // ── 3. 요청 파라미터 파싱 ────────────────────────────────
    const body = await req.json() as {
      paymentKey: string;
      orderId: string;
      amount: number;
    };
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount || amount <= 0) {
      return json({ error: '필수 파라미터가 누락되었습니다.' }, 400, corsHeaders);
    }

    // ── 4. service_role 클라이언트 (RLS 우회, DB 관리용) ─────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 5. 결제 주문 존재 여부 확인 ──────────────────────────
    const { data: order, error: orderError } = await adminClient
      .from('payment_orders')
      .select('status, plan, user_id')
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      return json({ error: '주문을 찾을 수 없습니다.' }, 404, corsHeaders);
    }

    // 본인 주문인지 확인
    if (order.user_id !== user.id) {
      return json({ error: '접근 권한이 없습니다.' }, 403, corsHeaders);
    }

    // 이미 처리된 주문 (Idempotency)
    if (order.status === 'completed') {
      return json({ success: true, message: '이미 처리된 결제입니다.', alreadyCompleted: true }, 200, corsHeaders);
    }

    // ── 6. TossPayments API 결제 승인 요청 ───────────────────
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      // 결제 실패 처리
      await adminClient
        .from('payment_orders')
        .update({ status: 'failed', metadata: tossData })
        .eq('order_id', orderId)
        .eq('user_id', user.id);

      return json({
        error: tossData.message || '결제 승인에 실패했습니다.',
        code: tossData.code,
      }, 400, corsHeaders);
    }

    // ── 7. 플랜별 크레딧 계산 ────────────────────────────────
    const plan       = order.plan || 'pro';
    const creditsMap: Record<string, number> = { pro: 100, school: 500, free: 0 };
    const creditsToAdd = creditsMap[plan] ?? 100;

    // ── 8. DB 원자적 업데이트 (트랜잭션 함수 호출) ──────────
    const { data: result, error: dbError } = await adminClient.rpc(
      'process_payment_completion',
      {
        p_user_id:     user.id,
        p_order_id:    orderId,
        p_payment_key: paymentKey,
        p_amount:      amount,
        p_plan:        plan,
        p_credits:     creditsToAdd,
        p_toss_data:   tossData,
      }
    );

    if (dbError) {
      console.error('DB update error:', dbError);
      return json({ error: 'DB 업데이트에 실패했습니다.' }, 500, corsHeaders);
    }

    return json({
      success:      true,
      message:      '결제가 완료되었습니다.',
      plan,
      creditsAdded: creditsToAdd,
      result,
    }, 200, corsHeaders);

  } catch (err) {
    console.error('Unexpected error:', err);
    return json({ error: '서버 내부 오류가 발생했습니다.' }, 500, corsHeaders);
  }
});

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
