
// ── 핵심 도메인 타입 (Supabase PostgreSQL 기반) ───────────────

export interface Classroom {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  classroom_id: string;
  student_number: string;
  name: string;
  created_at: string;
}

export interface Observation {
  id: string;
  user_id: string;
  student_id: string;
  classroom_id: string;
  content: string;
  normalized_content: string | null;
  created_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  student_id: string;
  classroom_id: string;
  char_limit: number;
  result_text: string;
  model_used: string | null;
  created_at: string;
}

export interface BatchResult {
  studentId: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  result?: string;
  error?: string;
}

// ── 구독 / 결제 타입 ──────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro' | 'school';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Credits {
  id: string;
  user_id: string;
  amount: number;
  updated_at: string;
}

export type PaymentOrderStatus = 'pending' | 'completed' | 'failed' | 'canceled';

export interface PaymentOrder {
  id: string;
  user_id: string;
  order_id: string;         // TossPayments orderId (idempotency key)
  payment_key: string | null; // TossPayments paymentKey
  amount: number;
  status: PaymentOrderStatus;
  plan: string | null;
  credits: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── 관리자 사용자 뷰 타입 ────────────────────────────────────

export interface AdminUserView {
  id: string;
  email: string;
  status: 'active' | 'blocked';
  role: 'user' | 'admin';
  plan: SubscriptionPlan;
  credits: number;
  created_at: string;
}
