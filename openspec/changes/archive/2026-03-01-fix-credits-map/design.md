## Context

`toss-payment-confirm` Edge Function은 결제 승인 후 플랜별 크레딧 수량을 결정하기 위해 `creditsMap` 상수를 사용한다. 현재 값:

```typescript
const creditsMap: Record<string, number> = { pro: 100, school: 500, free: 0 };
```

PricingPage에 표시된 값과 다르며, `plus` 플랜은 아예 없어 fallback으로 100이 지급된다.

## Goals / Non-Goals

**Goals:**
- `creditsMap`을 PricingPage 표시값과 일치시키기
- `plus` 플랜 크레딧 정상 지급 (500)

**Non-Goals:**
- 결제 흐름 구조 변경
- PricingPage UI 수정
- DB 스키마 변경

## Decisions

**단순 상수 수정으로 해결**
- 대안: PricingPage의 `PLANS` 배열에서 크레딧 값을 동적으로 읽기 → Edge Function(Deno)에서 클라이언트 코드를 직접 참조할 수 없으므로 불가
- 결론: Edge Function 내 `creditsMap` 상수를 직접 수정하는 것이 가장 단순하고 안전

수정 후 값:
```typescript
const creditsMap: Record<string, number> = { pro: 200, plus: 500, school: 999, free: 0 };
```

## Risks / Trade-offs

- [위험] 과거에 잘못 지급된 크레딧(pro 100, school 500, plus 100)은 소급 적용되지 않음 → 허용 범위로 판단, 필요 시 관리자 패널에서 수동 조정
- [위험] Edge Function 재배포 중 짧은 공백 → 영향 없음 (배포 시간 수초 이내)

## Migration Plan

1. `creditsMap` 수정
2. `supabase functions deploy toss-payment-confirm` 으로 재배포
3. 테스트 결제로 크레딧 수량 확인
