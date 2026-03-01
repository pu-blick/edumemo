## Why

AI 생기부 생성 시 Gemini API 호출 비용이 발생하지만, 현재 크레딧 차감 로직이 프론트엔드에 연동되어 있지 않아 모든 사용자가 무제한으로 API를 사용할 수 있는 상태다. 이로 인해 API 비용이 통제 없이 누적되며, 유료 구독 모델의 의미가 없어진다. 동시에, 본인 API 키를 보유한 사용자에게는 크레딧 없이 직접 키를 사용할 수 있는 옵션(BYOK)을 제공하여 유연성을 높인다.

## What Changes

- AI 생성(개별/일괄) 호출 전 크레딧 잔액을 확인하고, 생성 성공 시 `deduct_credit` RPC를 호출하여 크레딧을 차감한다
- 크레딧 부족 시 생성을 차단하고 구독 페이지로 유도하는 안내 메시지를 표시한다
- 사용자가 본인 Gemini API 키를 입력/저장/삭제할 수 있는 설정 UI를 추가한다
- 본인 API 키가 설정되어 있으면 크레딧 차감 없이 해당 키로 AI를 호출한다
- `geminiService`가 서비스 키와 사용자 키를 구분하여 사용하도록 수정한다

## Capabilities

### New Capabilities
- `credit-enforcement`: AI 생성 시 크레딧 잔액 확인 및 차감 연동, 부족 시 차단 및 안내
- `byok-api-key`: 사용자 본인 Gemini API 키 입력/저장/삭제 및 키 보유 시 크레딧 우회

### Modified Capabilities
(없음 - 기존 스펙 없음)

## Impact

- **서비스 코드**: `services/geminiService.ts` (API 키 분기), `pages/StudentDetail.tsx` (개별 생성), `pages/BatchGenerator.tsx` (일괄 생성)
- **DB/RPC**: 기존 `deduct_credit` 함수 활용 (추가 마이그레이션 불필요)
- **저장소**: 사용자 API 키 저장 위치 (Supabase `users` 테이블 컬럼 추가 또는 localStorage)
- **UI**: 설정 영역에 API 키 입력 폼 추가
