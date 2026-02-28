## Context

Supabase Edge Functions 호출 시 플랫폼 레벨에서 요청을 인증하려면 `apikey` 헤더(anon key)가 필요하다. `supabase.functions.invoke()`를 사용하면 자동으로 추가되지만, 현재 코드는 raw `fetch()`를 사용하여 `Authorization` 헤더만 전송하고 있다.

## Goals / Non-Goals

**Goals:**
- Edge Function 호출 시 401 오류 해결
- 기존 결제 흐름 구조 유지

**Non-Goals:**
- fetch → supabase.functions.invoke() 전면 교체 (오버엔지니어링)
- 다른 API 호출 방식 변경

## Decisions

**apikey 헤더 추가 + --no-verify-jwt 배포**
- 대안: `supabase.functions.invoke()`로 전환 → 오류 처리 방식이 달라져 코드 변경 범위가 큼
- 결론: 최소 변경으로 `apikey` 헤더만 추가하고, Edge Function은 `--no-verify-jwt`로 재배포해 함수 내부에서 직접 JWT 검증

`VITE_SUPABASE_ANON_KEY`는 이미 `lib/supabase.ts`에서 사용 중이므로 환경변수 추가 불필요.

## Risks / Trade-offs

- [위험] `--no-verify-jwt`로 배포하면 Supabase 플랫폼 레벨 JWT 검증 생략 → 함수 내부 검증(service_role key 기반)으로 대체, 보안 수준 동일
- [위험] 없음 — 코드 변경 최소화
