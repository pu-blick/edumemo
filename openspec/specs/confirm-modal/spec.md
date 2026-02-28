## ADDED Requirements

### Requirement: 확인 모달 표시
시스템은 `await confirm(message)` 호출 시 확인/취소 버튼이 있는 인앱 모달을 표시 SHALL.
확인 클릭 시 `true`, 취소 또는 바깥 영역 클릭 시 `false`를 반환 SHALL.

#### Scenario: 확인 선택
- **WHEN** `await confirm('삭제하시겠습니까?')`에서 사용자가 확인을 클릭하면
- **THEN** `true`를 반환하고 모달이 닫혀야 SHALL

#### Scenario: 취소 선택
- **WHEN** `await confirm('삭제하시겠습니까?')`에서 사용자가 취소를 클릭하면
- **THEN** `false`를 반환하고 모달이 닫혀야 SHALL

#### Scenario: 모달 외부 클릭
- **WHEN** 모달 바깥 영역(오버레이)을 클릭하면
- **THEN** `false`를 반환하고 모달이 닫혀야 SHALL

### Requirement: 전역 접근
어떤 컴포넌트에서도 `useConfirm()` hook으로 확인 모달을 호출할 수 있어야 SHALL.

#### Scenario: 하위 컴포넌트에서 호출
- **WHEN** 중첩된 하위 컴포넌트에서 `useConfirm()`을 호출하면
- **THEN** 앱 최상단에 모달이 정상 표시되어야 SHALL
