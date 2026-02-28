## Why

`PaymentSuccessPage`에서 Edge Function을 raw `fetch()`로 호출할 때 `apikey` 헤더가 누락되어 Supabase 플랫폼 레벨에서 401 Unauthorized가 반환된다. 결제는 TossPayments에서 성공했지만 DB 업데이트가 안 되어 "결제 실패" 화면이 표시된다.

## What Changes

- `PaymentSuccessPage.tsx`의 fetch 호출에 `apikey` 헤더 추가 (`VITE_SUPABASE_ANON_KEY`)
- Edge Function을 `--no-verify-jwt` 옵션으로 재배포 (플랫폼 레벨 JWT 검증 생략, 함수 내부에서 직접 검증)

## Capabilities

### New Capabilities

없음

### Modified Capabilities

- `payment-auth`: Edge Function 호출 시 인증 헤더를 올바르게 전송하도록 수정

## Impact

- `pages/PaymentSuccessPage.tsx` — fetch 헤더에 `apikey` 추가
- Edge Function 재배포 필요 (`--no-verify-jwt` 플래그)
