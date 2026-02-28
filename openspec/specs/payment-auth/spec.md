## MODIFIED Requirements

### Requirement: Edge Function 호출 시 인증 헤더
`PaymentSuccessPage`가 `toss-payment-confirm` Edge Function을 호출할 때 다음 헤더를 모두 포함 SHALL:
- `Authorization: Bearer <access_token>`
- `apikey: <anon_key>`
- `Content-Type: application/json`

#### Scenario: 결제 성공 후 Edge Function 인증 통과
- **WHEN** 사용자가 TossPayments 결제를 완료하고 성공 페이지로 리다이렉트되면
- **THEN** Edge Function 호출이 401 없이 통과 SHALL

#### Scenario: 유효하지 않은 세션 거부
- **WHEN** 세션 토큰이 유효하지 않으면
- **THEN** Edge Function 내부 검증에서 401을 반환 SHALL
