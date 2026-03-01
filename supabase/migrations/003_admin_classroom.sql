-- ============================================================
-- Migration 003: 관리자 채널(클래스룸) 관리 함수
-- ============================================================

-- 관리자 전용 - 전체 클래스룸 조회 (사용자 이메일, 학생 수 포함)
CREATE OR REPLACE FUNCTION public.admin_get_classrooms()
RETURNS TABLE (
  id            UUID,
  user_id       UUID,
  user_email    TEXT,
  name          TEXT,
  student_count BIGINT,
  created_at    TIMESTAMPTZ
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
    c.id,
    c.user_id,
    u.email::TEXT AS user_email,
    c.name,
    (SELECT COUNT(*) FROM public.students s WHERE s.classroom_id = c.id) AS student_count,
    c.created_at
  FROM public.classrooms c
  JOIN public.users u ON u.id = c.user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- 관리자 전용 - 클래스룸 삭제 (CASCADE로 학생 데이터도 삭제)
CREATE OR REPLACE FUNCTION public.admin_delete_classroom(p_classroom_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.email() <> 'admin@edumemo.com' THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  DELETE FROM public.classrooms WHERE id = p_classroom_id;

  INSERT INTO public.audit_log (user_id, action, table_name, record_id)
  VALUES (auth.uid(), 'admin_classroom_delete', 'classrooms', p_classroom_id::TEXT);
END;
$$;
