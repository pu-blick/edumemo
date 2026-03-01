## ADDED Requirements

### Requirement: 자리배치 폰트 Edumemo 톤 통일
사이드바 라벨, 입력칸, 강조 숫자의 폰트 크기·굵기·색상을 Edumemo 디자인 시스템에 맞춰야 SHALL.
초록색(`#1a4d2e`) 대신 인디고(`indigo-600`) 색상을 사용 SHALL.

#### Scenario: Controls 라벨 스타일
- **WHEN** 자리배치 사이드바의 라벨(배치표 이름, 가로 칸, 세로 줄)을 표시하면
- **THEN** `text-xs font-semibold` 스타일로 표시되어야 SHALL

#### Scenario: Controls 입력칸 스타일
- **WHEN** 사이드바 입력칸을 표시하면
- **THEN** `text-sm font-bold` 스타일이고 focus 테두리가 인디고색이어야 SHALL

#### Scenario: Capacity 숫자 색상
- **WHEN** 현재 좌석 수를 표시하면
- **THEN** 숫자가 인디고색(`text-indigo-600`)으로 표시되어야 SHALL

### Requirement: 좌석 내부 텍스트 크기 완화
좌석에 표시되는 학번·이름의 반응형 크기 점프를 완화 SHALL.

#### Scenario: 학번 텍스트 크기
- **WHEN** 좌석이 공개 상태이면
- **THEN** 학번이 `text-[10px] sm:text-sm lg:text-base`로 표시되어야 SHALL

#### Scenario: 이름 텍스트 크기
- **WHEN** 좌석이 공개 상태이면
- **THEN** 이름이 `text-[11px] sm:text-base lg:text-lg`로 표시되어야 SHALL

### Requirement: 헤더 버튼 폰트 크기 완화
헤더의 액션 버튼(룰렛, 이미지, 배치 시작)과 배치표 제목의 크기 점프를 완화 SHALL.

#### Scenario: 헤더 버튼 텍스트
- **WHEN** 헤더 액션 버튼을 표시하면
- **THEN** `text-xs sm:text-sm` 크기로 표시되어야 SHALL

#### Scenario: 배치표 제목 크기
- **WHEN** 배치표 제목을 표시하면
- **THEN** `text-xl sm:text-3xl`로 표시되어야 SHALL

### Requirement: 모바일 Navbar 자리배치 링크
모바일에서도 Navbar에 자리배치 진입 링크가 표시되어야 SHALL.

#### Scenario: 모바일 화면에서 자리배치 링크 표시
- **WHEN** 모바일 해상도에서 로그인된 상태로 Navbar를 표시하면
- **THEN** 자리배치 링크가 보여야 SHALL
