## 1. 클라이언트 수정

- [x] 1.1 `pages/PaymentSuccessPage.tsx`의 fetch 헤더에 `apikey: import.meta.env.VITE_SUPABASE_ANON_KEY` 추가

## 2. Edge Function 재배포

- [x] 2.1 `supabase functions deploy toss-payment-confirm --no-verify-jwt`로 재배포
