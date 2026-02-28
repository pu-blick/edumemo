-- ============================================================
-- Migration 002: DB 함수 추가 (CREATE OR REPLACE - 중복 안전)
-- 테이블은 001에서 이미 적용됨
-- ============================================================

-- ============================================================
-- 20. 결제 완료 처리 함수 (원자적 트랜잭션)
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_payment_completion(
  p_user_id    UUID,
  p_order_id   TEXT,
  p_payment_key TEXT,
  p_amount     INTEGER,
  p_plan       TEXT,
  p_credits    INTEGER,
  p_toss_data  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_period_end   TIMESTAMPTZ;
  v_existing     TEXT;
BEGIN
  SELECT status INTO v_existing
  FROM public.payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_existing = 'completed' THEN
    RETURN jsonb_build_object('status', 'already_completed');
  END IF;

  IF v_existing IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  v_period_end := NOW() + INTERVAL '1 month';

  UPDATE public.payment_orders
  SET
    status      = 'completed',
    payment_key = p_payment_key,
    credits     = p_credits,
    metadata    = p_toss_data,
    updated_at  = NOW()
  WHERE order_id = p_order_id AND user_id = p_user_id;

  INSERT INTO public.subscriptions
    (user_id, plan, status, current_period_start, current_period_end)
  VALUES
    (p_user_id, p_plan, 'active', NOW(), v_period_end)
  ON CONFLICT (user_id) DO UPDATE SET
    plan                 = EXCLUDED.plan,
    status               = 'active',
    current_period_start = NOW(),
    current_period_end   = v_period_end,
    updated_at           = NOW();

  INSERT INTO public.credits (user_id, amount)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE SET
    amount     = public.credits.amount + p_credits,
    updated_at = NOW();

  INSERT INTO public.audit_log
    (user_id, action, table_name, record_id, new_data)
  VALUES
    (p_user_id, 'payment_completed', 'payment_orders', p_order_id, p_toss_data);

  RETURN jsonb_build_object(
    'status',   'completed',
    'plan',     p_plan,
    'credits',  p_credits
  );
END;
$$;

-- ============================================================
-- 21. 관리자 전용 RPC - 전체 사용자 조회
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id         UUID,
  email      TEXT,
  status     TEXT,
  role       TEXT,
  plan       TEXT,
  credits    INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.email() <> 'admin@edumemo.com' THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.status,
    u.role,
    COALESCE(s.plan, 'free')    AS plan,
    COALESCE(c.amount, 0)       AS credits,
    u.created_at
  FROM public.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  LEFT JOIN public.credits c       ON c.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- ============================================================
-- 22. 관리자 전용 RPC - 사용자 상태 변경
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  p_target_user_id UUID,
  p_status         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.email() <> 'admin@edumemo.com' THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  IF p_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE public.users
  SET status = p_status, updated_at = NOW()
  WHERE id = p_target_user_id;

  INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
  VALUES (
    auth.uid(),
    'admin_status_change',
    'users',
    p_target_user_id::TEXT,
    jsonb_build_object('new_status', p_status)
  );
END;
$$;

-- ============================================================
-- 23. 크레딧 차감 함수
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_credit(p_amount INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current INTEGER;
BEGIN
  SELECT amount INTO v_current
  FROM public.credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Credit record not found';
  END IF;

  IF v_current < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', '크레딧이 부족합니다.');
  END IF;

  UPDATE public.credits
  SET amount = amount - p_amount, updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'remaining', v_current - p_amount);
END;
$$;
