## Why

Edge Function `toss-payment-confirm`의 `creditsMap`에 `plus` 플랜이 누락되어 있고, `pro`와 `school` 플랜의 크레딧 수량도 PricingPage UI 표시값과 다르다. 결제 성공 후 잘못된 크레딧이 지급되어 사용자 신뢰를 해친다.

## What Changes

- `creditsMap`에 `plus: 500` 추가
- `pro` 크레딧 100 → 200 으로 수정 (PricingPage 표시값과 일치)
- `school` 크레딧 500 → 999 으로 수정 (PricingPage 표시값과 일치)

## Capabilities

### New Capabilities

없음

### Modified Capabilities

- `credits-map-sync`: Edge Function `creditsMap`의 플랜별 크레딧 수량을 PricingPage 표시값과 동기화

## Impact

- `supabase/functions/toss-payment-confirm/index.ts` — `creditsMap` 상수 수정
- Edge Function 재배포 필요
- 기존 결제 흐름에는 영향 없음 (숫자 값만 변경)
