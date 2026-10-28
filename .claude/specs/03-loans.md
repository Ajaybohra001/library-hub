# Feature 3: Loans

## Goal

Authenticated members can borrow and return books while the system maintains copy availability, enforces lending limits and eligibility rules, records loan dates in UTC, and calculates overdue fines in integer paise. Staff can perform borrowing and returns on behalf of members where authorized.

## Requirements

1. **Create a loan: `POST /loans`** (authenticated member or staff)
   - Request JSON: `{ "bookId": string, "memberId"?: string }`.
   - `bookId` is required and must be a valid book identifier. `memberId` is required for STAFF requests and must identify the member on whose behalf the loan is created; for MEMBER requests it is omitted and derived from the authenticated user.
   - Unknown fields, missing fields, malformed identifiers, and invalid request data return `400 Bad Request`.
   - The authenticated user must be a MEMBER or STAFF. Missing, malformed, expired, or invalid tokens return `401 Unauthorized`.
   - A MEMBER may create a loan only for themself. A STAFF user may create a loan for the supplied member. Other role or identity violations return `403 Forbidden`.
   - The member must have fewer than 3 active loans. Otherwise return `409 Conflict`.
   - A member may not have an active loan for the same book. Otherwise return `409 Conflict`.
   - The book must have at least one available copy. Otherwise return `409 Conflict`.
   - A member with any unpaid fine or overdue active book may not borrow. Return `409 Conflict`.
   - On success, atomically decrement `availableCopies` by 1 and create an active loan.
   - Success: `201 Created` with `{ id, bookId, memberId, borrowedAt, dueAt, returnedAt, renewalCount, finePaise }`. `borrowedAt` is the current UTC timestamp; `dueAt` is 14 days after `borrowedAt`; `returnedAt` is `null`; `renewalCount` is `0`; `finePaise` is `0`.

2. **List a member's loans: `GET /loans`** (authenticated)
   - Optional query parameter `status`: `active`, `returned`, or `all` (default `active`). Invalid values return `400 Bad Request`.
   - MEMBER users can list only their own loans. STAFF users may supply an optional `memberId` query parameter to list a member's loans. A MEMBER supplying another member's ID returns `403 Forbidden`.
   - Success: `200 OK` with `{ "items": [Loan] }`, ordered by `borrowedAt` descending, then `id` ascending.
   - Unknown member ID returns `404 Not Found`; malformed IDs return `400 Bad Request`.

3. **Return a loan: `POST /loans/:id/return`** (authenticated member or staff)
   - `id` must be a valid loan identifier. Malformed IDs return `400 Bad Request`; unknown IDs return `404 Not Found`.
   - Only the borrowing MEMBER or a STAFF user may return the loan. Other authenticated members return `403 Forbidden`.
   - An already-returned loan cannot be returned again and returns `409 Conflict`.
   - On success, atomically set `returnedAt` to the current UTC timestamp and increment the book's `availableCopies` by 1.
   - The response is `200 OK` with the updated `Loan`. The overdue fine is `100 paise` for each overdue day, calculated using UTC dates and returned as integer `finePaise`; an on-time return has `finePaise` of `0`.

4. **Renew a loan: `POST /loans/:id/renew`** (authenticated member or staff)
   - `id` must be a valid loan identifier. Malformed IDs return `400 Bad Request`; unknown IDs return `404 Not Found`.
   - Only the borrowing MEMBER or a STAFF user may renew the loan. Other authenticated members return `403 Forbidden`.
   - A returned loan, a loan already renewed once, or a loan for a book currently reserved by another member cannot be renewed and returns `409 Conflict`.
   - On success, extend `dueAt` by 7 days, increment `renewalCount` to `1`, and return `200 OK` with the updated `Loan`.

5. **Data integrity, validation, and security**
   - All borrow, return, and renewal mutations are transactional so copy counts and loan records cannot become inconsistent under concurrent requests.
   - Dates are stored and returned as UTC ISO 8601 timestamps.
   - Money is stored and returned as integer paise; no floating-point amounts are used.
   - DTOs use `class-validator` with unknown fields rejected. Controllers remain thin and business rules live in the loans service.
   - Every new service method has unit tests covering success and error paths. No password hashes, tokens, or internal database fields are returned.

## Out of scope

- Book catalog creation, editing, and searching; these belong to the catalog feature.
- Fine payment, waiver, and account settlement; fine calculation for a returned loan is included, but payment belongs to the fines feature.
- Reservation creation and management; reservation state is consumed only to decide whether renewal is allowed.
- Member registration, profile management, and role administration; these belong to authentication and member features.
- Notifications, email reminders, lost-book workflows, and bulk loan imports.

## Acceptance criteria

- [ ] An authenticated MEMBER can borrow an available book and receives a 14-day due date.
- [ ] A STAFF user can borrow on behalf of a member by supplying `memberId`.
- [ ] An unauthenticated borrow, return, list, or renewal request returns `401 Unauthorized`.
- [ ] A member cannot exceed 3 active loans; the fourth borrow returns `409 Conflict`.
- [ ] A member cannot borrow a book with zero available copies.
- [ ] Borrowing decrements `availableCopies` exactly once, and returning increments it exactly once.
- [ ] A member cannot borrow the same book while an active loan exists.
- [ ] A member with an unpaid fine or overdue active book cannot borrow.
- [ ] Only the borrowing member or STAFF can return or renew a loan.
- [ ] Returning an already-returned loan returns `409 Conflict` and does not change copy counts.
- [ ] A valid return sets `returnedAt` in UTC and calculates overdue charges at 100 paise per overdue day using integer arithmetic.
- [ ] A loan can be renewed at most once and renewal adds exactly 7 days.
- [ ] Renewal is rejected when the book is reserved by another member.
- [ ] Invalid identifiers, query values, request bodies, and unknown fields return `400 Bad Request`.
- [ ] Unknown loan or member identifiers return `404 Not Found`.
- [ ] Unit tests cover every service method, including all documented success and error paths.
- [ ] Concurrent borrow/return operations preserve correct loan state and copy counts.
- [ ] No secrets or `.env` files are committed.

## Curl checks (for API features)

### Borrow as a member

```bash
curl -i -X POST "http://localhost:3000/loans" \
  -H "Authorization: Bearer <member-token>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<book-id>"}'
```

### Borrow on behalf of a member as staff

```bash
curl -i -X POST "http://localhost:3000/loans" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<book-id>","memberId":"<member-id>"}'
```

### List active loans

```bash
curl -i "http://localhost:3000/loans?status=active" \
  -H "Authorization: Bearer <member-token>"
```

### List a member's loans as staff

```bash
curl -i "http://localhost:3000/loans?memberId=<member-id>&status=all" \
  -H "Authorization: Bearer <staff-token>"
```

### Return a loan

```bash
curl -i -X POST "http://localhost:3000/loans/<loan-id>/return" \
  -H "Authorization: Bearer <member-token>"
```

### Renew a loan

```bash
curl -i -X POST "http://localhost:3000/loans/<loan-id>/renew" \
  -H "Authorization: Bearer <member-token>"
```
