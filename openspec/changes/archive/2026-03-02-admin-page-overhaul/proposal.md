## Why

어드민 페이지가 초기 구현 상태 그대로여서 플랜 라벨이 구독 페이지와 불일치하고, 채널 관리 UI가 사용자에게 보이지 않으며, "마스터 액션" 컬럼이 무슨 기능인지 직관적이지 않다. 데이터를 한눈에 파악할 수 있도록 레이아웃과 정렬을 전면 개선한다.

## What Changes

- **플랜 라벨 최신화**: DB 값(pro/plus/school/free/tester)을 구독 페이지와 동일한 표시명(Free/Basic/Pro/School/Event)으로 매핑 — 현재 코드에 매핑은 있으나 실제 배포에서 반영되지 않는 문제 점검
- **"마스터 액션" → "관리"로 변경**: 컬럼명을 직관적으로 바꾸고, 아이콘 버튼에 텍스트 라벨 추가 (PC에서 "PW 재설정", "차단"/"복구" 텍스트 병기)
- **채널 컬럼 정상 표시**: 채널 수 버튼 클릭 → 확장 → 채널 목록 + 삭제 기능이 정상 동작하도록 점검
- **테이블 정렬 규칙 통일**: 이메일·플랜·가입일 → 왼쪽정렬, 채널 수·계정 상태 → 중앙정렬, 관리 버튼 → 우측정렬
- **모바일 카드 레이아웃 정리**: 데이터 밀도를 높이되 가독성 유지, 채널 버튼이 눈에 띄도록 배치 조정
- **PC 테이블 컴팩트화**: 과도한 패딩 줄이고 행 높이를 낮춰 더 많은 데이터를 한 화면에 표시
- **하단 유의사항 문구 업데이트**: 액션 버튼 설명을 개선된 UI에 맞게 갱신

## Capabilities

### New Capabilities
- `admin-console`: 어드민 페이지 테이블/카드 레이아웃, 플랜 라벨 매핑, 채널 관리 UI, 정렬 규칙, 액션 버튼 UX를 포괄하는 단일 spec

### Modified Capabilities

## Impact

- `pages/AdminPage.tsx` — 전면 리라이트 (JSX 레이아웃, 클래스명, 컬럼 구조)
- 기존 로직(toggleUserStatus, handleResetPassword, handleDeleteClassroom, fetchData)은 변경 없음
- DB RPC 함수(admin_get_users, admin_get_classrooms, admin_delete_classroom)는 변경 없음
