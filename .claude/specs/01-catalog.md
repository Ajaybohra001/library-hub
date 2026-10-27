# Feature 1: Catalog

## Goal

Members and visitors can browse and search the library's book catalog to find titles and see how many copies are available. Staff can add and maintain books and copies. Catalog data is validated on every write and never exposes internal fields.

## Requirements

1. **List books: `GET /books`** (public, no token required)
   - Query parameters, all optional:
     - `q`: string. Matches title, author or ISBN, case-insensitive, partial match. Whitespace-only `q` is treated as absent.
     - `page`: integer, minimum 1, default `1`.
     - `limit`: integer from 1 to 100, default `20`.
   - Success: `200 OK` with `{ "items": [Book], "page": number, "limit": number, "total": number }`.
   - Each `Book` has: `id`, `title`, `author`, `isbn`, `description` (string or null), `totalCopies`, `availableCopies`, `createdAt` (ISO 8601, UTC).
   - Ordering: `title` ascending, then `id` ascending.
   - Invalid `page`, `limit` or other query values: `400 Bad Request`.
   - Request bodies are not accepted on this endpoint.

2. **Get a book: `GET /books/:id`** (public, no token required)
   - `id` must be a valid book identifier (UUID).
   - Success: `200 OK` with one `Book`.
   - Valid but unknown ID: `404 Not Found`.
   - Malformed ID: `400 Bad Request`.

3. **Create a book: `POST /books`** (staff only)
   - Request JSON: `{ "title": string, "author": string, "isbn": string, "description"?: string, "totalCopies": integer }`.
   - Validation:
     - `title`, `author`, `isbn`: required, non-empty after trimming.
     - `description`: optional, maximum 2000 characters.
     - `totalCopies`: integer, greater than 0.
   - ISBN normalization: remove hyphens and spaces, then uppercase. The result must be a valid ISBN-13 (13 digits with a correct check digit). Store the normalized value. Invalid ISBN: `400 Bad Request`.
   - Duplicate normalized ISBN: `409 Conflict`.
   - Unknown fields in the body: `400 Bad Request` (the validation pipe uses `forbidNonWhitelisted`).
   - Success: `201 Created` with the new `Book`, where `availableCopies` equals `totalCopies`.
   - Missing or invalid token: `401 Unauthorized`. Authenticated non-staff: `403 Forbidden`.

4. **Update a book: `PATCH /books/:id`** (staff only)
   - Request JSON may contain any subset of `title`, `author`, `isbn`, `description`, `totalCopies`. Each supplied value follows the same rules as creation. Empty body: `400 Bad Request`.
   - `totalCopies` must not drop below the number of currently loaned copies (`totalCopies - availableCopies`). Otherwise: `409 Conflict`.
   - Changing `totalCopies` by a delta also changes `availableCopies` by the same delta. For example, going from 3 to 4 total with 1 loaned moves available from 2 to 3.
   - Duplicate normalized ISBN: `409 Conflict`.
   - Success: `200 OK` with the updated `Book`.
   - Unknown ID: `404 Not Found`. Malformed ID or payload: `400 Bad Request`.
   - Missing or invalid token: `401 Unauthorized`. Authenticated non-staff: `403 Forbidden`.

5. **Data integrity and security**
   - Copy counts are stored and returned as integers. Timestamps are stored and returned in UTC.
   - Responses never include password hashes, tokens, or internal database fields beyond those listed in requirement 1.
   - Business rules live in the books service. Controllers stay thin. DTOs use `class-validator`.
   - Database schema changes are made with Prisma migrations only. Migration files are never hand-edited.

## Out of scope

- Borrowing, returning, renewing, reserving, or placing holds on books. These belong to the loans and reservations features.
- Fine calculation and payment.
- Member management and role administration.
- Authentication itself (registration, login, JWT issuance). This spec assumes Feature 2 provides a token that carries a role of `MEMBER` or `STAFF`.
- Cover-image uploads, recommendations, reviews, ratings, and bulk import or export.

## Acceptance criteria

- [ ] `GET /books` with no parameters returns `200 OK`, page 1, limit 20, ordered by title then ID.
- [ ] Search by a partial title, author, or ISBN returns matches case-insensitively.
- [ ] A whitespace-only `q` returns the same results as no `q`.
- [ ] `GET /books/:id` returns `200 OK` for an existing book.
- [ ] `GET /books/:id` returns `404 Not Found` for an unknown valid UUID.
- [ ] `GET /books/:id` returns `400 Bad Request` for a malformed ID.
- [ ] Invalid pagination values (for example `page=0`, `limit=101`) return `400 Bad Request`.
- [ ] Staff can create a valid book and receive `201 Created` with `availableCopies` equal to `totalCopies`.
- [ ] A create request with an invalid ISBN returns `400 Bad Request`.
- [ ] A create request with an unknown field returns `400 Bad Request`.
- [ ] A duplicate ISBN on create or update returns `409 Conflict`.
- [ ] Reducing `totalCopies` below the number of loaned copies returns `409 Conflict`.
- [ ] Increasing `totalCopies` increases `availableCopies` by the same amount.
- [ ] Staff can update valid fields and receive `200 OK`.
- [ ] A request with no token to a write endpoint returns `401 Unauthorized`.
- [ ] A member token on a write endpoint returns `403 Forbidden`.
- [ ] Unit tests cover every service method, including success and each error path.
- [ ] API tests cover every documented status code.
- [ ] No secrets or `.env` files are committed.

## Curl checks (for API features)

Write endpoints return `401 Unauthorized` until Feature 2 (auth) is built. That is expected at this stage, not a bug.

### List books

```bash
curl -i "http://localhost:3000/books?page=1&limit=20&q=tolkien"
```

### Get a book

```bash
curl -i "http://localhost:3000/books/<book-id>"
```

### Create a book as staff

```bash
curl -i -X POST "http://localhost:3000/books" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"The Hobbit","author":"J.R.R. Tolkien","isbn":"978-0-261-10221-7","description":"A fantasy novel","totalCopies":3}'
```

### Update a book as staff

```bash
curl -i -X PATCH "http://localhost:3000/books/<book-id>" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"totalCopies":4,"description":"Updated description"}'
```
