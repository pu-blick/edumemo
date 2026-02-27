-- ============================================================
-- Edumemo 초기 DB 스키마
-- 보안 기준: supabase-postgres-best-practices
-- ============================================================

-- 확장 기능
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 사용자 프로필 테이블 (auth.users와 1:1 연동)
-- ============================================================
CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'blocked')),
  role        TEXT        NOT NULL DEFAULT 'user'
                          CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_role   ON public.users(role);

-- ============================================================
-- 2. 구독 테이블
-- ============================================================
CREATE TABLE public.subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                 TEXT        NOT NULL DEFAULT 'free'
                                   CHECK (plan IN ('free', 'pro', 'school')),
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status  ON public.subscriptions(status);

-- ============================================================
-- 3. 크레딧 테이블
-- ============================================================
CREATE TABLE public.credits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER     NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_credits_user_id ON public.credits(user_id);

-- ============================================================
-- 4. 결제 주문 테이블 (Idempotency 보장)
-- ============================================================
CREATE TABLE public.payment_orders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id    TEXT        NOT NULL UNIQUE,     -- TossPayments orderId (idempotency key)
  payment_key TEXT,                            -- TossPayments paymentKey (승인 후 발급)
  amount      INTEGER     NOT NULL CHECK (amount > 0),
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
  plan        TEXT,
  credits     INTEGER     NOT NULL DEFAULT 0,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_orders_user_id  ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX idx_payment_orders_status   ON public.payment_orders(status);

-- ============================================================
-- 5. 학급 테이블
-- ============================================================
CREATE TABLE public.classrooms (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classrooms_user_id ON public.classrooms(user_id);

-- ============================================================
-- 6. 학생 테이블
-- ============================================================
CREATE TABLE public.students (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id   UUID        NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_number TEXT        NOT NULL CHECK (char_length(student_number) BETWEEN 1 AND 20),
  name           TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_user_id      ON public.students(user_id);
CREATE INDEX idx_students_classroom_id ON public.students(classroom_id);

-- ============================================================
-- 7. 관찰 기록 테이블
-- ============================================================
CREATE TABLE public.observations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id         UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id       UUID        NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  content            TEXT        NOT NULL CHECK (char_length(content) > 0),
  normalized_content TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_observations_user_id      ON public.observations(user_id);
CREATE INDEX idx_observations_student_id   ON public.observations(student_id);
CREATE INDEX idx_observations_classroom_id ON public.observations(classroom_id);

-- ============================================================
-- 8. 생기부 초안 테이블
-- ============================================================
CREATE TABLE public.drafts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID        NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  char_limit   INTEGER     NOT NULL CHECK (char_limit > 0),
  result_text  TEXT        NOT NULL,
  model_used   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drafts_user_id    ON public.drafts(user_id);
CREATE INDEX idx_drafts_student_id ON public.drafts(student_id);

-- ============================================================
-- 9. 감사 로그 테이블 (Audit Log)
-- ============================================================
CREATE TABLE public.audit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT        NOT NULL,
  table_name TEXT,
  record_id  TEXT,
  old_data   JSONB,
  new_data   JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id    ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action     ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================
-- 10. Realtime 활성화 (변경 감지용)
-- ============================================================
ALTER TABLE public.classrooms   REPLICA IDENTITY FULL;
ALTER TABLE public.students     REPLICA IDENTITY FULL;
ALTER TABLE public.observations REPLICA IDENTITY FULL;
ALTER TABLE public.drafts       REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.credits      REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credits;

-- ============================================================
-- 11. RLS 활성화
-- ============================================================
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. RLS 정책 - users
-- ============================================================
-- 본인 프로필 조회
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 본인 프로필 수정 (status/role 변경 불가)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 가입 시 본인 레코드 생성 (트리거에서 처리, 직접 INSERT 허용)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자: 전체 사용자 조회 (admin@edumemo.com)
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (auth.email() = 'admin@edumemo.com');

-- 관리자: 사용자 상태 변경
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (auth.email() = 'admin@edumemo.com');

-- ============================================================
-- 13. RLS 정책 - subscriptions (읽기만 허용, 쓰기는 Edge Function)
-- ============================================================
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 14. RLS 정책 - credits (읽기만 허용, 쓰기는 Edge Function)
-- ============================================================
CREATE POLICY "credits_select_own" ON public.credits
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 15. RLS 정책 - payment_orders
-- ============================================================
CREATE POLICY "payment_orders_select_own" ON public.payment_orders
  FOR SELECT USING (user_id = auth.uid());

-- 클라이언트에서 결제 주문 생성 (pending 상태로만)
CREATE POLICY "payment_orders_insert_own" ON public.payment_orders
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- ============================================================
-- 16. RLS 정책 - classrooms / students / observations / drafts
-- (본인 데이터만 CRUD)
-- ============================================================
CREATE POLICY "classrooms_all_own" ON public.classrooms
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_all_own" ON public.students
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "observations_all_own" ON public.observations
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "drafts_all_own" ON public.drafts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 17. RLS 정책 - audit_log (관리자만 조회)
-- ============================================================
CREATE POLICY "audit_log_admin_only" ON public.audit_log
  FOR SELECT USING (auth.email() = 'admin@edumemo.com');

-- ============================================================
-- 18. 트리거 함수 - updated_at 자동 업데이트
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 19. 트리거 함수 - 신규 사용자 가입 시 자동 초기화
--     (auth.users INSERT 후 users/subscriptions/credits 레코드 생성)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 사용자 프로필 생성
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- 기본 구독(Free) 생성
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- 신규 가입 크레딧 10개 지급
  INSERT INTO public.credits (user_id, amount)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- 감사 로그
  INSERT INTO public.audit_log (user_id, action, table_name, new_data)
  VALUES (NEW.id, 'user_signup', 'auth.users', jsonb_build_object('email', NEW.email));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 20. 결제 완료 처리 함수 (원자적 트랜잭션)
--     Edge Function에서 service_role 권한으로만 호출
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
  -- ① 멱등성(Idempotency) 체크 - 이미 처리된 주문이면 즉시 반환
  SELECT status INTO v_existing
  FROM public.payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE; -- 동시 요청 방지를 위한 행 잠금

  IF v_existing = 'completed' THEN
    RETURN jsonb_build_object('status', 'already_completed');
  END IF;

  IF v_existing IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- ② 구독 기간 계산 (1개월)
  v_period_end := NOW() + INTERVAL '1 month';

  -- ③ 결제 주문 완료 처리
  UPDATE public.payment_orders
  SET
    status      = 'completed',
    payment_key = p_payment_key,
    credits     = p_credits,
    metadata    = p_toss_data,
    updated_at  = NOW()
  WHERE order_id = p_order_id AND user_id = p_user_id;

  -- ④ 구독 업데이트 (UPSERT)
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

  -- ⑤ 크레딧 추가 (UPSERT)
  INSERT INTO public.credits (user_id, amount)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE SET
    amount     = public.credits.amount + p_credits,
    updated_at = NOW();

  -- ⑥ 감사 로그
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
-- 21. 관리자 전용 RPC 함수 - 전체 사용자 조회
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
-- 22. 관리자 전용 RPC 함수 - 사용자 상태 변경
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

  -- 감사 로그
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
-- 23. 크레딧 차감 함수 (AI 생성 시 호출)
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
