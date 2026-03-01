## ADDED Requirements

### Requirement: Pro 구독 접근 제어
`/seating` 라우트는 Pro, Plus, School 플랜 구독자만 접근 가능 SHALL.
Free 플랜 사용자가 접근하면 업그레이드 안내 페이지를 표시 SHALL.

#### Scenario: Pro 구독자 접근
- **WHEN** Pro 플랜 구독자가 `/seating`에 접근하면
- **THEN** 자리배치 페이지가 정상 표시되어야 SHALL

#### Scenario: Free 사용자 접근
- **WHEN** Free 플랜 사용자가 `/seating`에 접근하면
- **THEN** "Pro 플랜 이상 구독 시 이용 가능합니다" 안내와 구독 페이지 링크를 표시 SHALL

#### Scenario: 비로그인 사용자 접근
- **WHEN** 로그인하지 않은 사용자가 `/seating`에 접근하면
- **THEN** 로그인 페이지로 리다이렉트 SHALL

### Requirement: Navbar 메뉴 표시
Navbar에 자리배치 메뉴 링크를 표시 SHALL. Pro 이상 구독자에게만 활성화된 링크를 보여야 SHALL.

#### Scenario: Pro 구독자 Navbar
- **WHEN** Pro 구독자가 로그인하면
- **THEN** Navbar에 자리배치 링크가 활성화 상태로 표시되어야 SHALL
