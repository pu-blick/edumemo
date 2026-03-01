## Context

Edumemo는 React + Vite + Supabase + Tailwind 기반 SPA이며, 자리배치 앱도 React + Vite + Tailwind 기반 SPA이다. 두 앱의 기술 스택이 동일하여 컴포넌트 이전이 수월하다.

자리배치 앱 현황:
- 컴포넌트 4개: SeatingGrid, Controls, StudentInput, Roulette (합계 ~54KB)
- 의존성: lucide-react(이미 Edumemo에 있음), xlsx(추가 필요), html-to-image(CDN)
- 데이터 영속성 없음(in-memory only) — 통합 후에도 DB 저장은 하지 않음(1단계)
- Tailwind CDN 사용 중 — Edumemo는 Tailwind 빌드 사용이므로 CDN 제거 후 빌드에 통합

## Goals / Non-Goals

**Goals:**
- 자리배치 기능을 Edumemo `/seating` 라우트에서 사용 가능하게 함
- Pro 이상 구독자만 접근 허용, 미구독 시 업그레이드 안내
- 학급 선택 시 Edumemo DB에서 학생 자동 로드
- 기존 기능 100% 유지 (셔플, 제외, 비밀 고정, 교사 뷰, 룰렛, 이미지 내보내기)

**Non-Goals:**
- 자리배치 결과를 DB에 저장 (향후 과제)
- 독립 앱(smart-class-seating.netlify.app) 수정 — 그대로 유지
- 룰렛 기능 변경

## Decisions

### 결정 1: 컴포넌트 배치 구조

`components/seating/` 폴더를 만들어 자리배치 관련 컴포넌트를 모두 배치:

```
components/seating/
  SeatingGrid.tsx
  Controls.tsx
  StudentInput.tsx
  Roulette.tsx
pages/
  SeatingPage.tsx        ← 학급 선택 + 구독 체크 + 자리배치 앱 래핑
types/
  seating.ts             ← SeatingStudent, Seat, SeatingConfig, RouletteItem
```

Edumemo 기존 `Student` 타입(Supabase)과 자리배치 `Student` 타입이 다르므로 `SeatingStudent`로 이름을 변경하여 충돌 방지.

### 결정 2: 학급 연동 방식

SeatingPage에서:
1. Supabase에서 내 `classrooms` 조회
2. 학급 선택 드롭다운 표시
3. 선택 시 해당 학급의 `students` 조회
4. 학생 목록을 `SeatingStudent[]`로 변환하여 자리배치 컴포넌트에 전달
5. 수동 입력/엑셀 가져오기도 여전히 가능 (학급 미선택 시)

### 결정 3: Pro 구독 체크 방식

`ProRoute` 래퍼 컴포넌트 생성:
```tsx
const ProRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // subscriptions 테이블에서 현재 유저의 plan 조회
  // plan이 'pro', 'plus', 'school' 중 하나면 허용
  // 'free'면 업그레이드 안내 페이지 표시
};
```
기존 `PrivateRoute`(로그인 체크)와 조합하여 사용.

### 결정 4: html-to-image 의존성

CDN 대신 npm 패키지로 설치하여 빌드 시스템에 통합:
```bash
npm install html-to-image xlsx
```

### 결정 5: Tailwind CSS

자리배치 앱의 Tailwind CDN 클래스들은 Edumemo의 Tailwind 빌드에 이미 포함되므로 별도 처리 불필요. `index.html`의 커스텀 CSS(liquid-glass, capture-mode 등)만 Edumemo 스타일에 추가.

## Risks / Trade-offs

- [리스크] 컴포넌트 이전 시 import 경로 변경 누락 → 빌드 오류로 즉시 감지 가능
- [리스크] Edumemo `Student` 타입과 자리배치 `SeatingStudent` 타입 혼동 → 명확한 네이밍으로 방지
- [트레이드오프] DB 저장 없이 in-memory만 유지 → 단순하지만 새로고침 시 데이터 손실. 학급 연동이 있으므로 학생 재로드는 빠름
- [트레이드오프] npm 패키지 2개 추가(xlsx, html-to-image) → 번들 크기 증가하지만 기능에 필수
