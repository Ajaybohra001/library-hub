# Feature 2: Authentication

## Goal

Users can register and log in securely, receiving a signed JWT that identifies their account and role. JWT authentication protects staff-only write endpoints while keeping public catalog reads available without a token.

## Requirements

1. **Register: `POST /api/auth/register`**
   - Request JSON: `{ "name": string, "email": string, "password": string }`.
   - Validation:
     - `name`: required, string, non-empty after trimming.
     - `email`: required, valid email address; comparisons and uniqueness are case-insensitive.
     - `password`: required, non-empty string; plaintext passwords must never be persisted or returned.
     - Unknown fields: `400 Bad Request`.
   - Passwords are hashed with bcrypt using 10 salt rounds.
   - Every newly registered account has role `MEMBER`.
   - Success: `201 Created` with the created user's safe public data and no password hash or token, or the API's documented registration response.
   - Duplicate email: `409 Conflict`.
   - Invalid request data: `400 Bad Request`.

2. **Login: `POST /api/auth/login`**
   - Request JSON: `{ "email": string, "password": string }`.
   - Validation:
     - `email`: required, valid email address.
     - `password`: required, non-empty string.
     - Unknown fields: `400 Bad Request`.
   - The supplied password is verified against the stored bcrypt hash.
   - Success: `200 OK` with `{ "accessToken": string }` only.
   - The JWT is signed with the secret from the `JWT_SECRET` environment variable and expires after 7 days.
   - JWT payload: `{ "sub": userId, "email": email, "role": "MEMBER" | "STAFF" }`.
   - Unknown email or wrong password: `401 Unauthorized`; the response must not reveal which credential was incorrect.

3. **JWT authentication and request identity**
   - `JwtAuthGuard` requires a valid `Authorization: Bearer <token>` header on protected routes.
   - Missing, malformed, expired, incorrectly signed, or otherwise invalid tokens return `401 Unauthorized`.
   - A valid token is verified using `JWT_SECRET`, and the authenticated user is attached to the request.
   - Password hashes and token secrets are never attached to API responses.

4. **Role authorization**
   - `RolesGuard` checks the role metadata declared by `@Roles(...)`.
   - `POST /books` and `PATCH /books/:id` require `@Roles('STAFF')`.
   - A valid authenticated `MEMBER` token on a STAFF-only endpoint returns `403 Forbidden`.
   - `GET /books` and `GET /books/:id` remain public and do not require a token.

5. **Configuration and security**
   - `JWT_SECRET` is required for signing and verification and must not be hard-coded.
   - Passwords are stored only as bcrypt hashes using 10 salt rounds.
   - Controllers remain thin; authentication and authorization rules live in guards and services.
   - DTOs validate all request bodies with `class-validator`.
   - No `.env` files or secrets are committed.

## Out of scope

- Password reset, email verification, MFA, OAuth, refresh tokens, account deletion, and password changes.
- Member profile management or staff role administration.
- Loan, reservation, and fine rules; these belong to their respective features.
- Book catalog behavior other than applying authentication and STAFF authorization to its write endpoints.

## Acceptance criteria

- [ ] A valid registration creates an account with role `MEMBER` and returns no password hash.
- [ ] Registered passwords are bcrypt hashes generated with 10 salt rounds, never plaintext.
- [ ] Duplicate email registration returns `409 Conflict`.
- [ ] Invalid registration data and unknown request fields return `400 Bad Request`.
- [ ] A valid login returns `200 OK` with an `accessToken` property only.
- [ ] The returned JWT contains `sub`, `email`, and `role` claims and expires in 7 days.
- [ ] JWT signing and verification use `JWT_SECRET`; no secret is hard-coded or committed.
- [ ] Wrong password and unknown email both return `401 Unauthorized` without disclosing which credential failed.
- [ ] Requests without a token to `POST /books` and `PATCH /books/:id` return `401 Unauthorized`.
- [ ] Requests with an invalid or expired token to protected book writes return `401 Unauthorized`.
- [ ] A valid MEMBER token on protected book writes returns `403 Forbidden`.
- [ ] A valid STAFF token can access `POST /books` and `PATCH /books/:id`.
- [ ] `GET /books` and `GET /books/:id` remain accessible without a token.
- [ ] Unit tests cover registration, login, password hashing, duplicate users, invalid credentials, JWT claims, and guard behavior.
- [ ] No secrets or `.env` files are committed.

## Curl checks (for API features)

### Register a member

```bash
curl -i -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","email":"asha@example.com","password":"correct-horse-battery-staple"}'
```

### Login

```bash
curl -i -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"correct-horse-battery-staple"}'
```

### Login with a wrong password

```bash
curl -i -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"wrong-password"}'
```

### Public book list without a token

```bash
curl -i "http://localhost:3000/books"
```

### Create a book without a token

```bash
curl -i -X POST "http://localhost:3000/books" \
  -H "Content-Type: application/json" \
  -d '{"title":"The Hobbit","author":"J.R.R. Tolkien","isbn":"978-0-261-10221-7","totalCopies":3}'
```

### Create a book with a STAFF token

```bash
curl -i -X POST "http://localhost:3000/books" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"The Hobbit","author":"J.R.R. Tolkien","isbn":"978-0-261-10221-7","totalCopies":3}'
```

### Update a book with a STAFF token

```bash
curl -i -X PATCH "http://localhost:3000/books/<book-id>" \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated description"}'
```
