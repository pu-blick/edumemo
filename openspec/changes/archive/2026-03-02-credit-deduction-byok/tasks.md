## 1. geminiService 수정

- [x] 1.1 `generateStudentDraft`에 `apiKey?: string` 옵션 파라미터 추가, 전달 시 해당 키 사용, 없으면 `process.env.API_KEY` 사용
- [x] 1.2 BYOK 키로 호출 시 `API_KEY_INVALID` 에러를 "입력하신 API 키가 유효하지 않습니다"로 변환

## 2. 크레딧 확인/차감 유틸리티

- [x] 2.1 `services/creditService.ts` 생성: `checkCredit()` (잔액 조회), `deductCredit()` (`deduct_credit` RPC 호출) 함수 작성
- [x] 2.2 `checkCredit`은 `credits` 테이블에서 현재 유저의 `amount` 반환, `deductCredit`은 RPC 호출 후 결과 반환

## 3. BYOK localStorage 유틸리티

- [x] 3.1 `lib/byokStorage.ts` 생성: `getUserApiKey()`, `setUserApiKey(key)`, `removeUserApiKey()` 함수 (키: `edumemo_user_gemini_key`)

## 4. StudentDetail 페이지 크레딧 연동

- [x] 4.1 AI 생성 영역에 BYOK 토글 + API 키 입력 필드 UI 추가
- [x] 4.2 AI 생성 버튼 클릭 시: BYOK 키 없으면 `checkCredit()` → 잔액 0이면 차단 + 구독 안내 토스트
- [x] 4.3 AI 생성 성공 후: BYOK 키 없으면 `deductCredit()` 호출
- [x] 4.4 `generateStudentDraft` 호출 시 BYOK 키를 `apiKey` 파라미터로 전달

## 5. BatchGenerator 페이지 크레딧 연동

- [x] 5.1 AI 생성 영역에 BYOK 토글 + API 키 입력 필드 UI 추가 (StudentDetail과 동일)
- [x] 5.2 일괄 생성 시작 전: BYOK 키 없으면 `checkCredit()` → 잔액 < 선택 학생 수이면 차단 + "크레딧 부족 (필요: N, 보유: M)" 안내
- [x] 5.3 각 학생 AI 생성 성공 후: BYOK 키 없으면 `deductCredit()` 호출
- [x] 5.4 `generateStudentDraft` 호출 시 BYOK 키를 `apiKey` 파라미터로 전달

## 6. 검증

- [x] 6.1 크레딧 0인 상태에서 AI 생성 차단 확인
- [x] 6.2 AI 생성 성공 후 크레딧 잔액 감소 확인
- [x] 6.3 BYOK 키 입력 후 크레딧 무관하게 AI 생성 가능 확인
- [x] 6.4 BYOK 키 유효하지 않을 때 에러 메시지 확인
- [x] 6.5 일괄 생성 시 크레딧 부족 사전 차단 확인
