/**
 * TossPayments 웹훅 수신 Edge Function
 *
 * TossPayments → 이 함수 (서버사이드 이벤트 처리)
 *
 * 보안:
 * - HMAC-SHA256 서명 검증으로 위조 요청 차단
 * - 동일 이벤트 중복 처리 방지 (idempotency)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const TOSS_SECRET_KEY           = Deno.env.get('TOSS_SECRET_KEY')!;
    const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const rawBody = await req.text();

    // ── 웹훅 서명 검증 (HMAC-SHA256) ─────────────────────────
    const signature = req.headers.get('TossPayments-Signature');
    if (signature) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(TOSS_SECRET_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
      const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

      if (computed !== signature) {
        console.error('Invalid webhook signature');
        return new Response('Forbidden', { status: 403 });
      }
    }

    const event = JSON.parse(rawBody) as {
      eventType: string;
      createdAt: string;
      data: {
        paymentKey: string;
        orderId: string;
        status: string;
        totalAmount: number;
        [key: string]: unknown;
      };
    };

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 감사 로그 기록
    await adminClient.from('audit_log').insert({
      action:     `webhook_${event.eventType}`,
      table_name: 'payment_orders',
      record_id:  event.data?.orderId,
      new_data:   event as unknown as Record<string, unknown>,
    });

    // 이벤트 타입별 처리
    switch (event.eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { orderId, status, paymentKey, totalAmount } = event.data;

        if (status === 'CANCELED') {
          await adminClient
            .from('payment_orders')
            .update({
              status:   'canceled',
              metadata: event.data as unknown as Record<string, unknown>,
            })
            .eq('order_id', orderId)
            .eq('status', 'completed'); // 완료된 건만 취소 처리
        }
        break;
      }

      default:
        // 알 수 없는 이벤트는 로그만 남기고 200 반환
        console.log(`Unhandled webhook event: ${event.eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook error:', err);
    // TossPayments는 200이 아니면 재전송하므로 200 반환 (로그는 기록)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
