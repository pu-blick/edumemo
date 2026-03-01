## Why

자리배치 도우미를 Edumemo에 통합했으나, 독립 앱의 디자인 톤(초록색, 큰 폰트)이 그대로 남아 Edumemo UI와 이질적이다. 또한 PC에서 좌석이 납작하게 보이고, 모바일 Navbar에 자리배치 진입 링크가 없어 접근성이 떨어진다.

## What Changes

- PC 좌석 비율을 16:9 → 4:3으로 변경하여 책상 높이 확보
- 사이드바(Controls) 폰트 크기·굵기를 Edumemo 톤에 맞춤 (초록→인디고, 큰 텍스트→작은 텍스트)
- 좌석 내부 텍스트(학번·이름) 크기 점프 완화
- 헤더 버튼 텍스트 크기 점프 완화
- 모바일 Navbar에 자리배치 링크 추가

## Capabilities

### New Capabilities

- `seating-ui-consistency`: 자리배치 페이지의 좌석 비율, 폰트 크기·굵기·색상을 Edumemo 디자인 톤에 통일

### Modified Capabilities

- `seating-plan`: 좌석 aspect ratio 변경 (16:9 → 4:3)

## Impact

- `components/seating/SeatingGrid.tsx` — 좌석 비율, 텍스트 크기
- `components/seating/Controls.tsx` — 라벨·입력·색상 폰트 스타일
- `pages/SeatingPage.tsx` — 헤더 버튼·제목 폰트 크기
- `App.tsx` — Navbar 자리배치 링크 모바일 표시
