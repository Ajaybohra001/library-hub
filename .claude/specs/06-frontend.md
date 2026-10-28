# Feature 6: Frontend

## Goal

Provide a React, Vite, and TypeScript web application through which visitors can browse the public book catalog, users can register and log in, and authenticated members can borrow, return, renew, reserve books, and review their loans, reservations, and fines. The frontend presents role-appropriate controls, keeps API state consistent through React Query, and redirects users safely when authentication expires.

## Requirements

1. **Application foundation**
   - The frontend uses React, Vite, and TypeScript.
   - React Router provides navigation for these routes:
     - `/books` — public book list.
     - `/books/:id` — public book detail.
     - `/register` — registration.
     - `/login` — login.
     - `/loans` — authenticated member loans.
     - `/reservations` — authenticated member reservations.
     - `/fines` — authenticated member fines.
   - The frontend has a consistent navigation shell with links appropriate to the current authentication state.
   - Unknown routes display a not-found state and provide a link to `/books`.
   - API calls are made only through modules under `frontend/src/api/`; React components must not call `fetch` or an HTTP client directly.

2. **API configuration and authentication state**
   - The API base URL is read from `VITE_API_URL`; when it is unset, the default is `http://localhost:3000/api`.
   - The JWT access token is stored in `localStorage` after a successful login and removed on logout or an authentication-expiry response.
   - Authenticated API requests send `Authorization: Bearer <token>`.
   - A `401 Unauthorized` response clears the stored token and redirects the user to `/login`.
   - The redirect preserves a safe intended path when practical, so the user can return to the protected page after logging in; external URLs must never be used as redirect targets.
   - The UI derives the current user's role from the authenticated session/JWT sufficiently to apply role-based display rules, but never treats client-side role checks as API authorization.
   - No token, password, password hash, or secret is rendered in the UI or logged to the console.

3. **Public book list: `/books`**
   - Visitors can load the paginated catalog without logging in.
   - The page displays each book's title, author, ISBN, and available/total copy count, with a link to `/books/:id`.
   - The page supports the catalog search and pagination parameters documented by Feature 1.
   - Loading, empty, and API error states are independently visible and actionable.
   - When the current user has role `STAFF`, the page displays an `Add Book` control; the control is absent for visitors and members.
   - Catalog data is fetched and cached with React Query. Search, pagination, and mutations invalidate or update affected queries so stale copy counts are not presented after a successful action.

4. **Book detail: `/books/:id`**
   - Visitors can view a book's details without logging in.
   - The page displays title, author, ISBN, description, and copy availability from the catalog API.
   - A `Borrow` button is shown only when the user is logged in and `availableCopies > 0`.
   - A `Reserve` button is shown only when the user is logged in and `availableCopies = 0`.
   - Borrow and reserve actions disable while pending, show a success or error result, and invalidate the relevant book, loan, reservation, and catalog queries after success.
   - A visitor attempting an authenticated action is directed to `/login` rather than receiving a broken or misleading action state.
   - API errors such as maximum active loans, unpaid fines, overdue books, duplicate reservations, and unavailable inventory are shown as understandable messages without exposing stack traces.

5. **Registration: `/register`**
   - The form submits the registration shape defined by Feature 2: `name`, `email`, and `password`.
   - Required fields, email format, and password presence are validated before submission; server validation errors are also displayed.
   - Password input is not persisted in local storage, query parameters, or application logs.
   - A successful registration informs the user and provides a clear path to `/login`.
   - Duplicate email and other `400`/`409` responses are displayed without losing unrelated form values.

6. **Login and logout: `/login`**
   - The form submits `email` and `password` to the authentication API.
   - A successful login stores the returned access token and redirects to `/books` unless a safe protected destination was requested.
   - Invalid credentials display a generic authentication error and do not identify whether the email or password was wrong.
   - Submitting while a request is pending is prevented, and loading state is visible.
   - Authenticated users are redirected away from `/login` and `/register` to `/books`.
   - Logout removes the token, clears user-specific cached queries, and returns the user to `/books`.

7. **Member loans: `/loans`**
   - The route requires authentication; unauthenticated users are redirected to `/login`.
   - The page displays the member's active and returned loans with book identity, loan dates, due date, status, and renewal availability.
   - A member can return an active loan and can renew it only when the API permits it, including the one-renewal and reservation restrictions defined by Feature 3.
   - Loan actions show pending, success, and error states and invalidate loan and affected book queries after success.
   - Empty loan history has a clear empty state and link to browse books.

8. **Member reservations: `/reservations`**
   - The route requires authentication; unauthenticated users are redirected to `/login`.
   - The page displays the member's reservations with book identity, position/status, and relevant timestamps.
   - A member can cancel an eligible reservation, with confirmation appropriate to the action and clear handling of invalid or already completed reservations.
   - Reservation mutations invalidate reservation and affected book queries after success.
   - Empty reservations have a clear empty state and link to browse books.

9. **Member fines: `/fines`**
   - The route requires authentication; unauthenticated users are redirected to `/login`.
   - The page displays outstanding and paid fines, amount in integer paise converted for display as currency without floating-point business calculations, reason, status, and relevant dates.
   - The page provides the payment action supported by the fines API and shows pending, success, and failure states.
   - The UI makes clear when unpaid fines prevent borrowing, while the API remains the source of truth for eligibility.
   - Fine data is refreshed or invalidated after a successful payment.

10. **Staff controls**

- STAFF users see an `Add Book` control on `/books` and may access the corresponding book-creation UI.
- Non-STAFF users do not see staff-only controls; direct navigation to a staff-only frontend route displays an authorization state rather than exposing a form.
- The frontend never bypasses backend role authorization and handles `403 Forbidden` with a clear message.

11. **Quality, accessibility, and security**

- Forms have labels, keyboard-accessible controls, visible focus states, and accessible error messages.
- Buttons and links have descriptive text; loading states do not create duplicate submissions.
- Dates are rendered consistently from UTC API values, and money display is derived from integer paise.
- Components handle loading, empty, success, `400`, `401`, `403`, `404`, `409`, and unexpected API error states where applicable.
- TypeScript is used without avoidable `any` values, and API response types match the backend contracts.
- Frontend unit/component tests cover authentication state, protected-route redirects, role-based controls, successful actions, loading states, and representative API errors.
- No secrets or `.env` files are committed.

## Out of scope

- Implementing or changing backend endpoints, database models, Prisma migrations, JWT signing, authorization guards, fine calculation, or loan/reservation business rules.
- Password reset, email verification, MFA, OAuth, refresh tokens, profile management, or staff role administration.
- A separate admin panel; STAFF uses the same application UI with extra controls.
- Payment-provider integration beyond the existing fines API contract.
- Offline-first storage, server-side rendering, native mobile applications, cover-image uploads, reviews, recommendations, and analytics dashboards.

## Acceptance criteria

- [ ] A visitor can navigate to `/books`, browse paginated books, open `/books/:id`, and use search without logging in.
- [ ] A visitor can open `/register` and `/login`; valid registration and login flows display the documented success states.
- [ ] A successful login stores the JWT, redirects to `/books` by default, and displays authenticated navigation.
- [ ] An unauthenticated visit to `/loans`, `/reservations`, or `/fines` redirects to `/login`.
- [ ] A `401 Unauthorized` API response clears authentication and redirects to `/login`.
- [ ] A logged-in user sees `Borrow` only when `availableCopies > 0`, and sees `Reserve` only when `availableCopies = 0`.
- [ ] Borrowing, returning, renewing, reserving, cancelling, and paying show pending and result states and refresh affected React Query data.
- [ ] Members can view loans, reservations, and fines, including clear empty states.
- [ ] STAFF sees `Add Book` on the book list; members and visitors do not.
- [ ] A member does not see staff controls, and a `403 Forbidden` response is handled without exposing staff-only data.
- [ ] Invalid credentials show a generic error; passwords and tokens are never logged or rendered.
- [ ] API base URL uses `VITE_API_URL` and falls back to `http://localhost:3000/api`.
- [ ] Forms and key interactions are keyboard accessible and expose validation errors to assistive technology.
- [ ] Unit/component tests cover protected routes, auth persistence and expiry, role-based UI, successful mutations, loading states, and at least two API error cases.
- [ ] No secrets or `.env` files are committed.
