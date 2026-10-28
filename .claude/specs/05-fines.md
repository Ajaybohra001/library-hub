# Feature 5: Fines

## Goal

Authenticated members can view their outstanding fines and pay them, while STAFF can inspect fines for any member. The system records overdue charges on returned loans in integer paise, supports full settlement only, and removes unpaid-fine restrictions from borrowing and reservations after payment.

## Requirements

1. **List fines: `GET /fines`** (authenticated member or staff)
   - Optional query parameter: `memberId`.
   - MEMBER users may list only their own fines; a MEMBER supplying another member's ID returns `403 Forbidden`. For MEMBER requests without `memberId`, the member is derived from the authenticated identity.
   - STAFF users may supply `memberId` to list one member's fines. If STAFF omits `memberId`, the endpoint returns fines for all members.
   - Malformed identifiers return `400 Bad Request`; an unknown `memberId` returns `404 Not Found`.
   - Missing, malformed, expired, or invalid tokens return `401 Unauthorized`; unsupported roles return `403 Forbidden`.
   - Success: `200 OK` with `{ "items": [Fine] }`, where each item contains the associated loan and member identifiers, `finePaise`, and `paidAt`.
   - Only loans with `finePaise > 0` are included. Results are ordered by unpaid status first, then fine creation/return time descending, then loan ID ascending.

2. **Pay a fine: `POST /fines/:loanId/pay`** (authenticated member or staff)
   - `loanId` must be a valid loan identifier. Malformed identifiers return `400 Bad Request`; an unknown loan returns `404 Not Found`.
   - Only the member who owes the fine or a STAFF user may pay it. Other authenticated members receive `403 Forbidden`.
   - The loan must have `finePaise > 0`; attempting to pay a zero-value fine returns `400 Bad Request`.
   - A fine with a non-null `paidAt` is already settled and cannot be paid again; return `409 Conflict` without changing the timestamp or amount.
   - On success, atomically set `paidAt` to the current UTC timestamp. `finePaise` is never changed and there are no partial payments.
   - Success: `200 OK` with the updated fine representation containing `loanId`, `memberId`, `finePaise`, and `paidAt`.

3. **Fine creation and eligibility integration**
   - When an overdue loan is returned, the loans feature creates the fine automatically by setting `finePaise` on the loan. The fines feature does not recalculate or modify the amount.
   - Fine amounts are integer paise only. The overdue charge is `1000` paise per overdue day, calculated using UTC dates.
   - A fine is either fully unpaid (`paidAt = null`) or fully paid (`paidAt` is a UTC timestamp); partial payment is not supported.
   - Members with any unpaid fine cannot borrow or reserve. Once all their fines are paid, they are eligible again, subject to the other loan and reservation rules.
   - Payment must be idempotence-safe under concurrent requests: at most one successful payment transition may set `paidAt`, and a repeated or concurrent payment after settlement returns `409 Conflict`.

4. **Validation, authorization, and data integrity**
   - All endpoints require authentication. Controllers remain thin and business rules live in the fines service.
   - DTOs and query parameters use `class-validator`; unknown request fields are rejected.
   - Dates are stored and returned as UTC ISO 8601 timestamps.
   - Responses never include password hashes, tokens, or internal database fields.
   - Every new service method has unit tests covering success and error paths.

## Out of scope

- Loan creation, return processing, overdue detection, or fine creation; these belong to the loans feature.
- Fine waivers, adjustments, refunds, partial payments, or payment-provider integration.
- Member registration, authentication, profile management, and role administration.
- Reservation creation and lifecycle management; reservations only consume unpaid-fine eligibility.
- Email, SMS, push notifications, receipts, or accounting exports.

## Acceptance criteria

- [ ] An authenticated MEMBER can list their loans with `finePaise > 0`, including `paidAt`.
- [ ] A STAFF user can list fines for a specified member and can list all fines when `memberId` is omitted.
- [ ] An unauthenticated list or payment request returns `401 Unauthorized`.
- [ ] A MEMBER cannot view or pay another member's fine and receives `403 Forbidden`.
- [ ] A STAFF user can pay a fine for any member.
- [ ] Paying an unpaid fine sets `paidAt` to a UTC timestamp and preserves the integer `finePaise` amount.
- [ ] Paying a fine with `finePaise = 0` returns `400 Bad Request`.
- [ ] Paying an already-paid fine returns `409 Conflict` and does not alter its amount or timestamp.
- [ ] Fine amounts are never modified by listing or payment, and no partial payment is possible.
- [ ] A member with an unpaid fine is blocked from borrowing and reserving; after all fines are paid, those restrictions are removed.
- [ ] Concurrent payment attempts produce at most one successful payment transition.
- [ ] Invalid identifiers, query values, and unknown fields return `400 Bad Request`; unknown members or loans return `404 Not Found`.
- [ ] Unit tests cover every fines service method, including authorization, zero-value, already-paid, and successful payment paths.
- [ ] No secrets or `.env` files are committed.

## Curl checks (for API features)

### List own fines

```bash
curl -i "http://localhost:3000/fines" \
  -H "Authorization: Bearer <member-token>"
```

### List a member's fines as staff

```bash
curl -i "http://localhost:3000/fines?memberId=<member-id>" \
  -H "Authorization: Bearer <staff-token>"
```

### List all fines as staff

```bash
curl -i "http://localhost:3000/fines" \
  -H "Authorization: Bearer <staff-token>"
```

### Pay a fine

```bash
curl -i -X POST "http://localhost:3000/fines/<loan-id>/pay" \
  -H "Authorization: Bearer <member-token>"
```

### Pay a fine as staff

```bash
curl -i -X POST "http://localhost:3000/fines/<loan-id>/pay" \
  -H "Authorization: Bearer <staff-token>"
```
