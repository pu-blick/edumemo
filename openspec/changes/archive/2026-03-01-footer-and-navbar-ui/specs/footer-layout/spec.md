## MODIFIED Requirements

### Requirement: 푸터 사업자 정보 반응형 표시
푸터는 사업자 정보를 화면 크기에 따라 다른 레이아웃으로 표시 SHALL.
- PC(md 이상): 2줄 파이프(`|`) 구분 방식, `text-xs`(12px) 폰트 SHALL
- 모바일(md 미만): 항목별 줄바꿈 방식, `text-[11px]` 폰트 SHALL
세션 배지는 PC에서만 표시하고 모바일에서는 숨겨야 SHALL.

#### Scenario: PC에서 사업자 정보 표시
- **WHEN** PC(md 이상) 화면에서 푸터를 보면
- **THEN** 사업자 정보가 2줄 파이프 구분 방식으로 12px 폰트로 표시되어야 SHALL

#### Scenario: 모바일에서 사업자 정보 표시
- **WHEN** 모바일(md 미만) 화면에서 푸터를 보면
- **THEN** 사업자 정보가 항목별 줄바꿈으로 11px 폰트로 표시되어야 SHALL

#### Scenario: 모바일에서 세션 배지 숨김
- **WHEN** 모바일(md 미만) 화면에서 푸터를 보면
- **THEN** 세션 배지(SESSION: xxxxxxxx)가 표시되지 않아야 SHALL
