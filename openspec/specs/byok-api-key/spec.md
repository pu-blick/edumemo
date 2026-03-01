## ADDED Requirements

### Requirement: 사용자 본인 API 키 입력 및 저장
시스템은 사용자가 본인의 Gemini API 키를 입력하고 localStorage에 저장할 수 있는 UI를 제공해야 한다(SHALL).

#### Scenario: API 키 입력 및 저장
- **WHEN** 사용자가 AI 생성 영역에서 "내 API 키 사용" 토글을 활성화하고, API 키를 입력한 후 저장할 때
- **THEN** 입력된 키가 `localStorage`에 `edumemo_user_gemini_key` 키로 저장된다

#### Scenario: 저장된 API 키 불러오기
- **WHEN** 사용자가 AI 생성 영역을 방문할 때
- **THEN** `localStorage`에 저장된 API 키가 있으면 자동으로 불러와서 토글이 활성화된 상태로 표시된다

#### Scenario: API 키 삭제
- **WHEN** 사용자가 "내 API 키 사용" 토글을 비활성화하거나 키를 지울 때
- **THEN** `localStorage`에서 `edumemo_user_gemini_key`가 삭제된다

### Requirement: BYOK 키로 Gemini API 호출
시스템은 사용자 본인 API 키가 설정되어 있으면 서비스 기본 키 대신 해당 키로 Gemini API를 호출해야 한다(SHALL).

#### Scenario: BYOK 키로 AI 생성
- **WHEN** 사용자의 BYOK 키가 localStorage에 저장되어 있고, AI 생성을 요청할 때
- **THEN** `geminiService`가 BYOK 키를 사용하여 Gemini API를 호출한다

#### Scenario: BYOK 키 미설정 시 서비스 키 사용
- **WHEN** 사용자의 BYOK 키가 저장되어 있지 않고, AI 생성을 요청할 때
- **THEN** `geminiService`가 빌드 내장 서비스 키(`process.env.API_KEY`)를 사용하여 Gemini API를 호출한다

#### Scenario: BYOK 키가 유효하지 않을 때
- **WHEN** 사용자의 BYOK 키로 Gemini API 호출 시 `API_KEY_INVALID` 오류가 발생할 때
- **THEN** "입력하신 API 키가 유효하지 않습니다" 오류 메시지가 표시된다

### Requirement: BYOK 모드에서 크레딧 차감 우회
BYOK 키가 설정되어 있을 때 시스템은 크레딧 잔액 확인 및 차감을 수행하지 않아야 한다(SHALL NOT).

#### Scenario: BYOK 모드 무제한 사용
- **WHEN** BYOK 키가 설정된 상태에서 AI 생성을 반복 요청할 때
- **THEN** 크레딧 잔액과 무관하게 생성이 허용되며, 크레딧이 차감되지 않는다
