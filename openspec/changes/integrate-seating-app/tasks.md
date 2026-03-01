## 1. 의존성 및 타입 준비

- [x] 1.1 `package.json`에 `xlsx`, `html-to-image` 의존성 추가 및 설치
- [x] 1.2 `types/seating.ts` 생성 — SeatingStudent, Seat, SeatingConfig, RouletteItem 타입 정의
- [x] 1.3 `index.html`에 capture-mode, liquid-glass 등 커스텀 CSS 추가

## 2. 컴포넌트 이전

- [x] 2.1 `components/seating/SeatingGrid.tsx` — 원본에서 이전, import 경로 수정, Student→SeatingStudent 타입 변경
- [x] 2.2 `components/seating/Controls.tsx` — 원본에서 이전, import 경로 수정
- [x] 2.3 `components/seating/StudentInput.tsx` — 원본에서 이전, import 경로 수정, xlsx import 방식 변경
- [x] 2.4 `components/seating/Roulette.tsx` — 원본에서 이전, import 경로 수정

## 3. Pro 접근 제어

- [x] 3.1 `App.tsx`에 ProRoute 컴포넌트 생성 — subscriptions 테이블에서 플랜 조회, free면 업그레이드 안내 표시
- [x] 3.2 업그레이드 안내 UI 작성 — PricingPage로 이동 링크 포함

## 4. 자리배치 페이지

- [x] 4.1 `pages/SeatingPage.tsx` 생성 — 기존 App.tsx 로직을 페이지 컴포넌트로 래핑
- [x] 4.2 학급 선택 드롭다운 추가 — Supabase에서 내 classrooms 조회, 선택 시 students 로드
- [x] 4.3 Edumemo students → SeatingStudent 변환 로직 구현
- [x] 4.4 학급 미선택 시 기존 수동 입력/엑셀 모드 유지

## 5. 라우트 및 네비게이션

- [x] 5.1 `App.tsx`에 `/seating` 라우트 추가 — PrivateRoute + ProRoute 래핑
- [x] 5.2 Navbar에 자리배치 메뉴 링크 추가 — Pro 이상 구독자에게만 활성화
- [x] 5.3 SeatingPage import 추가
