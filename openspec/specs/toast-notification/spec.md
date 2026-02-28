## ADDED Requirements

### Requirement: Toast 알림 표시
시스템은 `error` / `success` / `warning` / `info` 4가지 유형의 토스트를 우측 상단에 표시 SHALL.
토스트는 2.5초 후 자동으로 사라져야 하며, PC·모바일 모두 동일하게 동작 SHALL.

#### Scenario: 오류 토스트 표시
- **WHEN** `showToast('저장 실패', 'error')`가 호출되면
- **THEN** 우측 상단에 rose 색상 토스트가 표시되고 2.5초 후 사라져야 SHALL

#### Scenario: 성공 토스트 표시
- **WHEN** `showToast('복사되었습니다.', 'success')`가 호출되면
- **THEN** 우측 상단에 emerald 색상 토스트가 표시되고 2.5초 후 사라져야 SHALL

#### Scenario: 플랜 한도 경고 토스트 표시
- **WHEN** `showToast('최대 5개의 클래스...', 'warning')`가 호출되면
- **THEN** 우측 상단에 amber 색상 토스트가 표시되고 2.5초 후 사라져야 SHALL

### Requirement: 전역 접근
어떤 컴포넌트에서도 `useToast()` hook으로 토스트를 호출할 수 있어야 SHALL.

#### Scenario: 하위 컴포넌트에서 호출
- **WHEN** 중첩된 하위 컴포넌트에서 `useToast()`를 호출하면
- **THEN** 앱 최상단에 토스트가 정상 표시되어야 SHALL
