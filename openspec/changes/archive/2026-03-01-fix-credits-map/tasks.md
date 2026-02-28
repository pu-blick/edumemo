## 1. Edge Function 수정

- [x] 1.1 `supabase/functions/toss-payment-confirm/index.ts`의 `creditsMap`을 `{ pro: 200, plus: 500, school: 999, free: 0 }`으로 수정

## 2. 배포

- [x] 2.1 `supabase functions deploy toss-payment-confirm`으로 Edge Function 재배포
