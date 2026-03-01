## ADDED Requirements

### Requirement: 학급 선택 및 학생 자동 로드
자리배치 페이지 상단에 Edumemo 학급 선택 드롭다운을 표시 SHALL.
학급 선택 시 해당 학급의 학생 목록을 Supabase에서 조회하여 자리배치 컴포넌트에 전달 SHALL.

#### Scenario: 학급 선택 후 학생 자동 로드
- **WHEN** 드롭다운에서 "1반"을 선택하면
- **THEN** Supabase classrooms/students에서 해당 학급의 학생이 자리배치 학생 목록에 자동 채워져야 SHALL

#### Scenario: 학급 미선택 시 수동 입력
- **WHEN** 학급을 선택하지 않거나 "직접 입력"을 선택하면
- **THEN** 기존 방식(수동 입력, 엑셀 가져오기)으로 학생을 등록할 수 있어야 SHALL

### Requirement: 학생 데이터 변환
Edumemo `students` 테이블의 데이터를 자리배치 `SeatingStudent` 형식으로 변환 SHALL.
`students.id` → `SeatingStudent.id`, `students.name` → `SeatingStudent.name` 매핑 SHALL.

#### Scenario: 학생 데이터 변환
- **WHEN** Edumemo에서 학생 데이터를 로드하면
- **THEN** `{ id: student.id, name: student.name }` 형태로 변환되어야 SHALL
