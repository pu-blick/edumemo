## Context

현재 Gemini API 키는 `GEMINI_API_KEY` 환경변수로 빌드 시 번들에 포함된다(`vite.config.ts`의 `process.env.API_KEY`). `geminiService.ts`에서 이 키로 AI를 호출하지만, DB에 정의된 `deduct_credit` RPC를 호출하지 않아 크레딧이 차감되지 않는다. 결제/구독 시스템은 완비되어 있으나 실제 과금 게이트가 빠져 있는 상태.

## Goals / Non-Goals

**Goals:**
- AI 생성 시 `deduct_credit` RPC를 호출하여 크레딧을 차감한다
- 크레딧 부족 시 생성을 차단하고 구독 페이지로 안내한다
- 사용자 본인 Gemini API 키를 입력하면 크레딧 차감 없이 무제한 사용 가능하게 한다
- BYOK 키는 localStorage에 저장하여 서버에 민감 정보를 보내지 않는다

**Non-Goals:**
- 서버 사이드 API 키 검증 (프론트엔드 직접 호출 구조 유지)
- API 키 암호화 (localStorage 기본 저장, 브라우저 보안에 위임)
- 크레딧 차감 실패 시 자동 재시도 로직

## Decisions

### 1. BYOK 키 저장: localStorage
- **선택**: `localStorage`에 `edumemo_user_gemini_key` 키로 저장
- **대안**: Supabase `users` 테이블에 컬럼 추가
- **근거**: API 키를 서버에 전송하지 않으므로 보안 부담이 적음. 현재 Gemini 호출이 클라이언트에서 직접 이루어지므로 서버 저장 불필요. 기기 간 동기화는 불필요 (각 기기에서 개별 설정)

### 2. 크레딧 차감 타이밍: AI 호출 성공 후 차감
- **선택**: Gemini API 호출 성공 후 `deduct_credit` RPC 호출
- **대안**: 호출 전 선차감 후 실패 시 환불
- **근거**: 호출 실패 시 크레딧을 잃지 않음. `deduct_credit`이 잔액 확인 + 차감을 원자적으로 처리하므로 경합 조건 위험 낮음

### 3. 크레딧 잔액 사전 확인: 프론트에서 `credits` 테이블 조회
- **선택**: AI 생성 버튼 클릭 시 먼저 `credits` 테이블에서 `amount` 조회, 0이면 즉시 차단
- **근거**: 불필요한 API 호출 방지, 빠른 UX 피드백

### 4. geminiService에 API 키 매개변수 추가
- **선택**: `generateStudentDraft`에 `apiKey?: string` 옵션 파라미터 추가, 있으면 해당 키 사용, 없으면 빌드 내장 키 사용
- **근거**: 서비스 함수의 순수성 유지, 호출부에서 BYOK 키 주입

### 5. BYOK 설정 UI: AI 생성 패널 내 간단한 토글/입력
- **선택**: StudentDetail과 BatchGenerator의 AI 생성 영역에 "내 API 키 사용" 토글 + 입력 필드 추가
- **대안**: 별도 설정 페이지
- **근거**: 설정 페이지가 없고, AI 사용 맥락에서 바로 설정하는 것이 직관적

## Risks / Trade-offs

- **[localStorage 초기화]** → 브라우저 데이터 삭제 시 BYOK 키 소실 → 사용자가 재입력하면 됨 (치명적이지 않음)
- **[크레딧 차감 실패]** → API 호출 성공 후 `deduct_credit` RPC 실패 시 크레딧 무차감으로 AI 사용됨 → 빈도가 매우 낮고, 실패 시 console 경고 로깅으로 대응
- **[동시 요청 경합]** → 같은 유저가 여러 탭에서 동시 생성 시 크레딧 초과 사용 가능 → `deduct_credit`의 `FOR UPDATE` 행 잠금으로 방어됨
