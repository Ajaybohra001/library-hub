# Feature 4: Reservations

## Goal

Authenticated members can queue for unavailable books and receive a 48-hour hold when a copy becomes available. The system prevents duplicate or ineligible reservations, assigns holds in queue order, preserves copy-count integrity, and allows members and staff to cancel reservations.

## Requirements

1. **Create a reservation: `POST /reservations`** (authenticated member or staff)
   - Request JSON: `{ "bookId": string, "memberId"?: string }`.
   - `bookId` is required and must be a valid book identifier. `memberId` is required for STAFF requests and is derived from the authenticated user for MEMBER requests.
   - MEMBER users may create reservations only for themself. STAFF users may create a reservation for the supplied member. Missing, malformed, expired, or invalid tokens return `401 Unauthorized`; identity or role violations return `403 Forbidden`.
   - Unknown fields, missing fields, malformed identifiers, and invalid request data return `400 Bad Request`.
   - The book must exist. An unknown book ID returns `404 Not Found`.
   - A reservation is allowed only when `availableCopies` is `0`; otherwise return `409 Conflict`.
   - A member may not reserve a book for which they have an active loan. Return `409 Conflict`.
   - A member may not have another active reservation for the same book. Active statuses are `PENDING` and `HOLD`; return `409 Conflict` for a duplicate.
   - A member with unpaid fines cannot reserve. Return `409 Conflict`.
   - A member may have at most 3 active reservations (`PENDING` and `HOLD`). Return `409 Conflict` when the limit is reached.
   - On success, create a `PENDING` reservation with a UTC `createdAt`, a null `holdExpiresAt`, and a queue position determined by active reservation creation order.
   - Success: `201 Created` with `{ id, bookId, memberId, status, createdAt, holdExpiresAt }`.

2. **List reservations: `GET /reservations`** (authenticated)
   - Optional query parameters: `status` (`PENDING`, `HOLD`, `FULFILLED`, `CANCELLED`, or `EXPIRED`) and `memberId`.
   - MEMBER users can list only their own reservations; a MEMBER supplying another member's ID returns `403 Forbidden`. STAFF users may supply `memberId` or omit it to list all reservations.
   - Malformed identifiers or invalid status values return `400 Bad Request`; an unknown member ID returns `404 Not Found`.
   - Success: `200 OK` with `{ "items": [Reservation] }`, ordered by `createdAt` ascending, then `id` ascending. Each reservation includes `id`, `bookId`, `memberId`, `status`, `createdAt`, and `holdExpiresAt`.

3. **Cancel a reservation: `POST /reservations/:id/cancel`** (authenticated member or staff)
   - `id` must be a valid reservation identifier. Malformed IDs return `400 Bad Request`; unknown IDs return `404 Not Found`.
   - A MEMBER may cancel only their own reservation. STAFF may cancel any reservation. Unauthorized ownership returns `403 Forbidden`.
   - A `FULFILLED`, `CANCELLED`, or `EXPIRED` reservation cannot be cancelled and returns `409 Conflict`.
   - Cancelling a `PENDING` reservation removes it from the active queue and sets its status to `CANCELLED`.
   - Cancelling a `HOLD` reservation sets it to `CANCELLED`, releases the held copy, increments `availableCopies` by 1, and assigns the next `PENDING` reservation for the same book to `HOLD` atomically. The new hold has `holdExpiresAt = now + 48 hours`.
   - Success: `200 OK` with the updated reservation.

4. **Allocate returned copies and expire holds**
   - When a book is returned and at least one active reservation exists, the returned copy is not added to `availableCopies`. Instead, the first `PENDING` reservation in queue order becomes `HOLD` with `holdExpiresAt = now + 48 hours`.
   - The allocation and loan return are one transaction. A returned copy cannot be allocated to more than one reservation.
   - A member with a `HOLD` reservation may borrow the book. The successful loan atomically sets that reservation to `FULFILLED`; `availableCopies` remains unchanged because the held copy is borrowed immediately.
   - A hold whose `holdExpiresAt` is reached without a corresponding loan changes to `EXPIRED`, increments `availableCopies` by 1, and promotes the next `PENDING` reservation for that book to `HOLD` with a new 48-hour UTC expiry. Promotion and copy-count changes are atomic.
   - Expiry processing must be safe to run repeatedly; an already expired, cancelled, or fulfilled reservation must not change copy counts twice.
   - The expiry mechanism may be a scheduled service or an explicitly invoked internal service method; it is not a public unauthenticated endpoint.

5. **Statuses, validation, and data integrity**
   - Reservation statuses are exactly `PENDING`, `HOLD`, `FULFILLED`, `CANCELLED`, and `EXPIRED`.
   - Only authenticated users can create, list, or cancel reservations.
   - All reservation, promotion, expiry, return, and fulfilment mutations are transactional and preserve correct `availableCopies` under concurrent requests.
   - Dates are stored and returned as UTC ISO 8601 timestamps.
   - DTOs use `class-validator`; unknown fields are rejected. Controllers remain thin and reservation rules live in the reservations service.
   - Every new service method has unit tests covering success and error paths. Responses never include password hashes, tokens, or internal database fields.

## Out of scope

- Book catalog creation, editing, and searching; these belong to the catalog feature.
- Member registration, authentication, profile management, and role administration; these belong to authentication and member features.
- Fine calculation, payment, waiver, or settlement; reservation eligibility only consumes unpaid-fine state.
- Loan creation, return, and renewal behavior except for the reservation transitions required to allocate and fulfil a hold.
- Email, SMS, push notifications, or notification delivery. The API exposes the hold and expiry timestamps; notification delivery is a separate feature.
- Book transfers, lost or damaged copies, and automatic reservation expiration unrelated to a `HOLD`.

## Acceptance criteria

- [ ] An authenticated MEMBER can reserve a book with zero available copies and receives `201 Created` with `PENDING` status.
- [ ] An unauthenticated create, list, or cancel request returns `401 Unauthorized`.
- [ ] A book with available copies cannot be reserved and returns `409 Conflict`.
- [ ] A member cannot reserve a book they currently have on active loan.
- [ ] A member cannot create a duplicate active reservation for the same book.
- [ ] A member with unpaid fines cannot reserve, and a member cannot exceed 3 active reservations.
- [ ] A STAFF user can create a reservation on behalf of a member and cancel any reservation; a MEMBER cannot act for another member.
- [ ] A MEMBER can list and cancel only their own reservations.
- [ ] A returned copy promotes the first `PENDING` reservation to `HOLD` with a 48-hour UTC expiry without increasing `availableCopies`.
- [ ] Borrowing a held book marks the reservation `FULFILLED` and does not change `availableCopies` a second time.
- [ ] An expired hold becomes `EXPIRED`, increases `availableCopies` exactly once, and promotes the next queued reservation.
- [ ] Cancelling a held reservation releases exactly one copy and promotes the next queued reservation atomically.
- [ ] Terminal reservations cannot be cancelled and repeated expiry processing does not alter copy counts.
- [ ] Invalid identifiers, status values, request bodies, and unknown fields return `400 Bad Request`; unknown resources return `404 Not Found`; ownership violations return `403 Forbidden`.
- [ ] Unit tests cover every service method, including all documented success, authorization, conflict, and transition paths.
- [ ] Concurrent return, cancellation, expiry, and fulfilment operations preserve reservation order and correct copy counts.
- [ ] No secrets or `.env` files are committed.

## Curl checks (for API features)

### Create a reservation as a member

```bash
curl -i -X POST "http://localhost:3000/reservations" \
  -H "Authorization: Bearer <member-token>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<book-id>"}'
```

### Create a reservation on behalf of a member as staff

```bash
curl -i -X POST "http://localhost:3000/reservations" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<book-id>","memberId":"<member-id>"}'
```

### List own reservations

```bash
curl -i "http://localhost:3000/reservations?status=PENDING" \
  -H "Authorization: Bearer <member-token>"
```

### List a member's reservations as staff

```bash
curl -i "http://localhost:3000/reservations?memberId=<member-id>" \
  -H "Authorization: Bearer <staff-token>"
```

### Cancel a reservation

```bash
curl -i -X POST "http://localhost:3000/reservations/<reservation-id>/cancel" \
  -H "Authorization: Bearer <member-token>"
```
