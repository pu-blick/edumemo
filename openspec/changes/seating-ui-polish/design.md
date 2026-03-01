## Context

자리배치 도우미는 독립 앱(`#1a4d2e` 초록 톤, 큰 폰트)에서 Edumemo(인디고 톤, 컴팩트 폰트)로 통합되었다. CSS 클래스만 수정하면 되며 로직 변경은 없다.

## Goals / Non-Goals

**Goals:**
- 좌석 비율을 PC/모바일 모두 4:3으로 통일하여 책상 느낌 확보
- 폰트 크기·굵기·색상을 Edumemo 디자인 시스템에 맞춤
- 모바일 Navbar에서 자리배치에 접근 가능하게 함

**Non-Goals:**
- 자리배치 로직 변경
- 새 컴포넌트 추가
- 이미지 내보내기(capture-mode) CSS 변경

## Decisions

### 결정 1: 좌석 비율 통일

현재 `aspect-[4/3] sm:aspect-video`에서 `sm:aspect-video` 제거 → 모든 해상도에서 `aspect-[4/3]`.

대안: PC만 `aspect-[3/2]`로 구분 → 불필요한 복잡성. 4:3이 책상 비율로 자연스럽다.

### 결정 2: 폰트 크기 체계

Edumemo 기존 패턴 기준:
- 라벨: `text-xs font-semibold`
- 입력: `text-sm font-bold`
- 강조 숫자: `text-lg font-black`
- 색상: `indigo-600` (Edumemo 메인), 초록(`#1a4d2e`) 제거

좌석 내부 텍스트는 반응형 점프를 완화:
- 학번: `text-[10px] sm:text-sm lg:text-base` (기존 sm:text-xl lg:text-2xl에서 축소)
- 이름: `text-[11px] sm:text-base lg:text-lg` (기존 sm:text-xl lg:text-3xl에서 축소)

### 결정 3: 모바일 Navbar 링크

`hidden md:flex` → `flex`로 변경하여 모바일에서도 자리배치 링크 표시.

## Risks / Trade-offs

- [리스크] 좌석 텍스트 축소로 긴 이름 잘림 가능 → `truncate` 클래스가 이미 적용되어 있으므로 문제없음
- [트레이드오프] capture-mode CSS는 변경하지 않음 → 이미지 내보내기 시 폰트 크기는 별도 클래스로 제어되므로 영향 없음
