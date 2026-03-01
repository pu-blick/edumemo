## ADDED Requirements

### Requirement: 룰렛 추첨
시스템은 등록된 항목 중에서 N명의 당첨자를 슬롯머신 애니메이션으로 추첨 SHALL.
당첨자 수는 1~항목 수 범위에서 설정 가능 SHALL.

#### Scenario: 3명 당첨자 추첨
- **WHEN** 25명 중 3명 당첨으로 설정하고 추첨 버튼을 클릭하면
- **THEN** 드럼 애니메이션 후 3명의 당첨자가 순서대로 표시되어야 SHALL

### Requirement: 룰렛 항목 관리
수동 입력, 엑셀 가져오기, 학생 목록 자동 로드로 항목을 관리 SHALL.

#### Scenario: 학생 목록으로 룰렛 항목 자동 채우기
- **WHEN** 룰렛을 열면
- **THEN** 현재 등록된 학생 목록이 룰렛 항목으로 자동 로드되어야 SHALL
