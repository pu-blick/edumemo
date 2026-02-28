## Why

앱 전체에서 브라우저 네이티브 `alert()`·`window.confirm()`을 26곳에서 사용 중이다. 네이티브 다이얼로그는 사이트 URL이 표시되고, PC·모바일 모두 디자인이 없어 보여 사용자 경험을 해친다. 스타일이 적용된 인앱 컴포넌트로 교체해 일관된 UX를 제공한다.

## What Changes

- **Toast 컴포넌트** 신규 생성 — 오류·성공·경고 메시지를 우측 상단에 표시
- **ConfirmModal 컴포넌트** 신규 생성 — 삭제·로그아웃 등 확인이 필요한 액션에 사용
- **앱 전체 26곳** `alert()` → Toast, `window.confirm()` → ConfirmModal 교체:
  - `App.tsx` (1곳: 로그아웃 confirm)
  - `pages/Dashboard.tsx` (4곳: 클래스 한도 alert, 저장/수정 실패 alert, 삭제 confirm)
  - `pages/ClassroomDetail.tsx` (2곳: 학생 한도 alert, 등록 실패 alert)
  - `pages/StudentDetail.tsx` (5곳: 수정 실패, 기록 선택, AI 오류, 마이크 권한, 복사 완료)
  - `pages/BatchGenerator.tsx` (1곳: 학생 미선택 alert)
  - `pages/AdminPage.tsx` (5곳: 상태 변경 confirm/alert, 비밀번호 재설정 confirm/alert)
  - `pages/PricingPage.tsx` (2곳: 결제 오류 alert)
  - `pages_StudentDetail.tsx` (6곳: 구버전 파일 동일 처리)

## Capabilities

### New Capabilities

- `toast-notification`: 우측 상단 토스트 알림 (오류·성공·경고·플랜 한도 유형)
- `confirm-modal`: 인앱 확인 모달 (확인/취소 버튼 포함)

### Modified Capabilities

없음

## Impact

- `components/Toast.tsx` 신규
- `components/ConfirmModal.tsx` 신규
- `hooks/useToast.ts` 신규 (토스트 상태 관리)
- `hooks/useConfirm.ts` 신규 (confirm 모달 상태 관리)
- 위 26곳 파일 수정
- 외부 의존성 추가 없음 (순수 Tailwind CSS)
