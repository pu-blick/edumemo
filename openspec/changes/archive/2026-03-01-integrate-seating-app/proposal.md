## Why

독립적으로 운영 중인 "학급 관리 도우미(자리배치)" 앱을 Edumemo에 통합하여 Pro 구독자에게 부가 기능으로 제공한다. 통합하면 Edumemo에 등록된 학급·학생 데이터가 자동 연동되어 수동 입력이 필요 없어지고, Pro 구독 가치가 올라간다.

## What Changes

- Edumemo에 `/seating` 라우트 추가 (Pro 구독자 전용)
- 자리배치 앱의 핵심 컴포넌트(SeatingGrid, Controls, StudentInput, Roulette)를 Edumemo 프로젝트로 이전
- Edumemo `classrooms` + `students` 테이블과 연동하여 학급 선택 시 학생 자동 로드
- 구독 플랜 체크 — Pro 이상만 접근, 미구독 시 업그레이드 안내 표시
- Navbar에 자리배치 메뉴 링크 추가
- `xlsx` 패키지 및 `html-to-image` CDN 의존성 추가

## Capabilities

### New Capabilities
- `seating-plan`: 자리배치 셔플, 제외 모드, 비밀 고정, 교사/학생 뷰, 이미지 내보내기
- `seating-roulette`: 룰렛/추첨 기능 (다중 당첨자, 엑셀 가져오기)
- `seating-classroom-sync`: Edumemo 학급·학생 데이터 자동 연동
- `pro-gate`: Pro 구독 여부 확인 후 접근 제어

### Modified Capabilities
없음

## Impact

- `App.tsx` — `/seating` 라우트 및 Navbar 메뉴 추가
- `pages/SeatingPage.tsx` — 신규 (메인 자리배치 페이지)
- `components/seating/` — 신규 (SeatingGrid, Controls, StudentInput, Roulette 이전)
- `types/seating.ts` — 신규 (Student, Seat, SeatingConfig, RouletteItem 타입)
- `package.json` — `xlsx` 의존성 추가
- `index.html` — `html-to-image` CDN 추가
- Supabase 쿼리 추가 (classrooms, students 조회)
