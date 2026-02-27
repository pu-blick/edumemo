import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 누락되었습니다.\n' +
    'VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 .env 파일에 설정해 주세요.\n' +
    '.env.example 파일을 참고하세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // 세션 자동 저장 (localStorage)
    autoRefreshToken: true,    // JWT 토큰 자동 갱신
    detectSessionInUrl: true,  // URL에서 세션 감지 (OAuth 콜백 등)
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
