## 1. 좌석 비율 및 텍스트

- [x] 1.1 `SeatingGrid.tsx` — 좌석 `sm:aspect-video` 제거하여 `aspect-[4/3]` 통일
- [x] 1.2 `SeatingGrid.tsx` — 학번 텍스트 `sm:text-xl lg:text-2xl` → `sm:text-sm lg:text-base`
- [x] 1.3 `SeatingGrid.tsx` — 이름 텍스트 `sm:text-xl lg:text-3xl` → `sm:text-base lg:text-lg`
- [x] 1.4 `SeatingGrid.tsx` — 미공개 좌석 번호 `sm:text-xl` → `sm:text-sm`

## 2. Controls 폰트 정리

- [x] 2.1 `Controls.tsx` — 라벨 `text-[14px] font-medium` → `text-xs font-semibold`
- [x] 2.2 `Controls.tsx` — 입력칸 `text-lg font-bold` → `text-sm font-bold`
- [x] 2.3 `Controls.tsx` — Capacity 숫자 `text-xl text-[#1a4d2e]` → `text-lg text-indigo-600`
- [x] 2.4 `Controls.tsx` — focus 테두리 `focus:border-[#1a4d2e]` → `focus:border-indigo-500`

## 3. 헤더 버튼 및 제목

- [x] 3.1 `SeatingPage.tsx` — 룰렛/이미지 버튼 `text-sm sm:text-xl` → `text-xs sm:text-sm`
- [x] 3.2 `SeatingPage.tsx` — 배치 시작 버튼 `text-sm sm:text-lg` → `text-xs sm:text-sm`
- [x] 3.3 `SeatingPage.tsx` — 배치표 제목 `text-2xl sm:text-5xl` → `text-xl sm:text-3xl`

## 4. 모바일 Navbar

- [x] 4.1 `App.tsx` — 자리배치 링크 `hidden md:flex` → `flex`
