## Context

`App.tsx` 단일 파일 내 `Navbar`와 `AppContent`(footer) 컴포넌트를 수정한다.
현재 Navbar의 이메일 표시 영역은 `hidden md:flex`로 모바일에서 완전히 숨겨져 있고,
푸터는 `text-[10px]` 고정 폰트와 한 줄 파이프 구분 방식으로 모바일 가독성이 낮다.

## Goals / Non-Goals

**Goals:**
- 모바일 Navbar에 `@` 앞 아이디 표시
- PC Navbar에 전체 이메일 표시 (기존 유지)
- 푸터 폰트를 PC/모바일 각각 적절한 크기로 조정
- 푸터 사업자 정보를 모바일에서 항목별 줄바꿈으로 분리
- 모바일 푸터에서 세션 배지 숨김

**Non-Goals:**
- Navbar/Footer 컴포넌트 분리 또는 파일 이동
- 다크모드 대응
- 기능 로직 변경

## Decisions

### 결정 1: 이메일 표시 방식 — 텍스트 분기 vs truncate

**선택: 텍스트 분기 (방법 A)**

```tsx
{/* 모바일: 아이디만 */}
<span className="flex md:hidden ...">
  {user.email.split('@')[0]}
</span>
{/* PC: 전체 이메일 */}
<span className="hidden md:flex ...">
  {user.email}
</span>
```

`truncate` 방식은 `@` 앞부분이 잘릴 보장이 없어 제외.

### 결정 2: 푸터 모바일 레이아웃 — 파이프 유지 vs 줄바꿈

**선택: 모바일 줄바꿈, PC 파이프 유지**

- PC(`md:` 이상): 기존 2줄 파이프 구분 유지
- 모바일: `<p>` 태그를 항목별로 분리하여 자연스러운 줄바꿈

### 결정 3: 폰트 크기

| 위치 | 현재 | 변경 후 |
|------|------|---------|
| 푸터 사업자 정보 (PC) | `text-[10px]` | `text-xs` (12px) |
| 푸터 사업자 정보 (모바일) | `text-[10px]` | `text-[11px]` |
| 푸터 링크 | `text-[10px]` | `text-xs` (12px) |

## Risks / Trade-offs

- [리스크] 이메일에 `@`가 없는 비정상 계정 → `split('@')[0]` 결과가 전체 문자열이 되어 UI가 길어질 수 있음 → Supabase Auth 이메일 필수 검증이 있어 실제 발생 가능성 없음
- [트레이드오프] 모바일에서 아이디만 보이므로 같은 아이디의 다른 도메인 계정을 구분 못함 → 실사용 환경에서 동일 아이디 다른 도메인 가능성 낮아 수용 가능
