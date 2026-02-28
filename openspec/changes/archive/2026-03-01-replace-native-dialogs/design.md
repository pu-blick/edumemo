## Context

앱은 Tailwind CSS 기반 React/TypeScript SPA다. UserTable 컴포넌트에 이미 로컬 토스트 패턴(`showToast`)이 구현되어 있으나 전역 공유가 안 된다. 이를 전역 공유 가능한 구조로 확장한다.

## Goals / Non-Goals

**Goals:**
- 전체 `alert()` / `window.confirm()` 제거
- PC·모바일 모두 일관된 스타일 적용
- 기존 코드 구조 최소 변경

**Non-Goals:**
- 서드파티 라이브러리 도입 (react-hot-toast 등)
- UserTable 내부 로컬 toast 교체 (별도 범위)
- 애니메이션 고도화

## Decisions

**Hook 기반 전역 상태 + Context**
- `useToast` hook: 토스트 메시지 표시/숨김 상태 관리
- `useConfirm` hook: 모달 표시·Promise 반환 (await 패턴으로 기존 confirm() 교체 용이)
- `ToastProvider` / `ConfirmProvider`를 `App.tsx` 루트에 주입 → 하위 어디서든 hook으로 호출

```tsx
// 기존
alert('저장 실패');

// 변경 후
const { showToast } = useToast();
showToast('저장 실패', 'error');
```

```tsx
// 기존
if (!window.confirm('삭제하시겠습니까?')) return;

// 변경 후
const confirm = useConfirm();
if (!await confirm('삭제하시겠습니까?')) return;
```

**Toast 유형 4가지**
| 유형 | 색상 | 사용처 |
|------|------|--------|
| `error` | rose | 실패, 오류 |
| `success` | emerald | 성공, 완료 |
| `warning` | amber | 한도 초과 안내 |
| `info` | indigo | 일반 안내 |

## Risks / Trade-offs

- [위험] Context 추가로 App.tsx 구조 변경 → 최소화 (Provider 2개만 추가)
- [위험] `useConfirm`의 Promise 패턴이 생소할 수 있음 → 패턴 단순화로 해결

## Migration Plan

1. 공통 컴포넌트·훅 생성
2. App.tsx에 Provider 주입
3. 파일별 순차 교체
4. 빌드 확인 후 배포
