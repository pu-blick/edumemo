## ADDED Requirements

### Requirement: AI 생성 전 크레딧 잔액 확인
시스템은 AI 생기부 생성 요청 시 사용자의 크레딧 잔액을 확인하여, BYOK 키가 없고 잔액이 0인 경우 생성을 차단해야 한다(SHALL).

#### Scenario: 크레딧 잔액 충분
- **WHEN** 사용자가 AI 생성 버튼을 클릭하고, BYOK 키가 설정되지 않았으며, 크레딧 잔액이 1 이상일 때
- **THEN** AI 생성이 정상 진행된다

#### Scenario: 크레딧 잔액 부족
- **WHEN** 사용자가 AI 생성 버튼을 클릭하고, BYOK 키가 설정되지 않았으며, 크레딧 잔액이 0일 때
- **THEN** "크레딧이 부족합니다" 메시지가 표시되고, 구독 페이지로 이동할 수 있는 링크가 제공된다

#### Scenario: BYOK 키 사용 시 잔액 확인 생략
- **WHEN** 사용자가 AI 생성 버튼을 클릭하고, BYOK 키가 설정되어 있을 때
- **THEN** 크레딧 잔액 확인 없이 AI 생성이 진행된다

### Requirement: AI 생성 성공 후 크레딧 차감
시스템은 AI 생기부 생성이 성공한 후 `deduct_credit` RPC를 호출하여 1크레딧을 차감해야 한다(SHALL). BYOK 키 사용 시에는 차감하지 않는다(SHALL NOT).

#### Scenario: 개별 생성 시 크레딧 차감
- **WHEN** 학생 상세 페이지에서 AI 초안 생성이 성공하고, BYOK 키가 없을 때
- **THEN** `deduct_credit(1)` RPC가 호출되어 크레딧이 1 차감된다

#### Scenario: 일괄 생성 시 학생당 크레딧 차감
- **WHEN** 일괄 생성에서 N명의 학생에 대해 각각 AI 생성이 성공하고, BYOK 키가 없을 때
- **THEN** 성공한 학생 수만큼 `deduct_credit(1)`이 각각 호출된다

#### Scenario: BYOK 키 사용 시 크레딧 미차감
- **WHEN** AI 생성이 성공하고, BYOK 키가 설정되어 있을 때
- **THEN** `deduct_credit`은 호출되지 않는다

#### Scenario: AI 생성 실패 시 크레딧 미차감
- **WHEN** Gemini API 호출이 실패하여 AI 생성이 실패했을 때
- **THEN** `deduct_credit`은 호출되지 않으며 크레딧 잔액에 변화가 없다

### Requirement: 일괄 생성 전 크레딧 총량 사전 확인
시스템은 일괄 생성 시작 전 선택된 학생 수와 현재 크레딧 잔액을 비교하여, 잔액이 부족하면 사전에 경고해야 한다(SHALL).

#### Scenario: 일괄 생성 크레딧 충분
- **WHEN** 선택된 학생이 10명이고, BYOK 키가 없으며, 크레딧 잔액이 10 이상일 때
- **THEN** 일괄 생성이 정상 시작된다

#### Scenario: 일괄 생성 크레딧 부족
- **WHEN** 선택된 학생이 10명이고, BYOK 키가 없으며, 크레딧 잔액이 5일 때
- **THEN** "크레딧이 부족합니다 (필요: 10, 보유: 5)" 메시지가 표시되고 생성이 시작되지 않는다
