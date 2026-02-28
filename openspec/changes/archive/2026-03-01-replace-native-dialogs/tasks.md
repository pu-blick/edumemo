## 1. 공통 컴포넌트·훅 생성

- [x] 1.1 `hooks/useToast.ts` 생성 — Toast 상태(message, type, visible) + showToast 함수 + Context
- [x] 1.2 `hooks/useConfirm.ts` 생성 — Promise 기반 confirm 상태 + Context
- [x] 1.3 `components/Toast.tsx` 생성 — error/success/warning/info 유형별 스타일 적용
- [x] 1.4 `components/ConfirmModal.tsx` 생성 — 오버레이 + 확인/취소 버튼 모달

## 2. App.tsx Provider 주입

- [x] 2.1 `App.tsx`에 `ToastProvider`, `ConfirmProvider` 주입 및 `Toast`, `ConfirmModal` 렌더링

## 3. 페이지별 교체

- [x] 3.1 `pages/Dashboard.tsx` — alert 4곳, window.confirm 1곳 교체
- [x] 3.2 `pages/ClassroomDetail.tsx` — alert 2곳 교체
- [x] 3.3 `pages/StudentDetail.tsx` — alert 5곳 교체
- [x] 3.4 `pages/BatchGenerator.tsx` — alert 1곳 교체
- [x] 3.5 `pages/AdminPage.tsx` — alert 3곳, window.confirm 2곳 교체
- [x] 3.6 `pages/PricingPage.tsx` — alert 2곳 교체
- [x] 3.7 `pages_StudentDetail.tsx` — alert 6곳 교체 (구버전 파일)

## 4. 빌드 및 배포

- [x] 4.1 로컬 빌드 오류 없음 확인
- [x] 4.2 git commit 및 push → Netlify 배포
