## MODIFIED Requirements

### Requirement: creditsMap 플랜별 크레딧 수량
`toss-payment-confirm` Edge Function은 결제 완료 후 플랜에 따라 다음 크레딧을 지급 SHALL:

| 플랜 | 지급 크레딧 |
|------|-----------|
| free | 0 |
| pro | 200 |
| plus | 500 |
| school | 999 |

알 수 없는 플랜에 대한 fallback은 허용되지 않으며, 누락된 플랜은 명시적으로 정의 SHALL.

#### Scenario: plus 플랜 결제 완료 시 크레딧 지급
- **WHEN** 사용자가 plus 플랜 결제를 완료하면
- **THEN** 시스템은 정확히 500 크레딧을 지급 SHALL

#### Scenario: pro 플랜 결제 완료 시 크레딧 지급
- **WHEN** 사용자가 pro 플랜 결제를 완료하면
- **THEN** 시스템은 정확히 200 크레딧을 지급 SHALL

#### Scenario: school 플랜 결제 완료 시 크레딧 지급
- **WHEN** 사용자가 school 플랜 결제를 완료하면
- **THEN** 시스템은 정확히 999 크레딧을 지급 SHALL
