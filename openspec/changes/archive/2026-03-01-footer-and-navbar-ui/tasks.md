## 1. Navbar 이메일 표시 개선

- [x] 1.1 `App.tsx` Navbar — 이메일 배지 영역을 모바일용(`flex md:hidden`)과 PC용(`hidden md:flex`) 두 `<span>`으로 분리
- [x] 1.2 모바일용 `<span>`에 `user.email.split('@')[0]` 적용하여 아이디만 표시

## 2. 푸터 레이아웃 개선

- [x] 2.1 `App.tsx` footer — 사업자 정보 영역을 PC용(`hidden md:block`)과 모바일용(`block md:hidden`)으로 분리
- [x] 2.2 PC용: 기존 2줄 파이프 구분 유지, 폰트 `text-[10px]` → `text-xs`
- [x] 2.3 모바일용: 항목별 `<p>` 태그로 분리하여 줄바꿈 레이아웃 적용, 폰트 `text-[11px]`
- [x] 2.4 세션 배지에 `hidden md:block` 적용하여 모바일에서 숨김
- [x] 2.5 푸터 링크(개인정보 처리방침/이용약관) 폰트 `text-[10px]` → `text-xs`
