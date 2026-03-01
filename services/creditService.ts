import { supabase } from '../lib/supabase';

/** 현재 로그인 유저의 크레딧 잔액 반환 (조회 실패 시 0) */
export async function checkCredit(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .single();

  return data?.amount ?? 0;
}

/** 크레딧 1 차감. 성공 여부와 남은 잔액 반환 */
export async function deductCredit(): Promise<{ success: boolean; remaining: number; message?: string }> {
  const { data, error } = await supabase.rpc('deduct_credit', { p_amount: 1 });

  if (error) {
    console.error('[Credit] deduct_credit RPC error:', error.message);
    return { success: false, remaining: 0, message: '크레딧 차감 중 오류가 발생했습니다.' };
  }

  return {
    success: data?.success ?? false,
    remaining: data?.remaining ?? 0,
    message: data?.message,
  };
}
