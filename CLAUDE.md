# LibraryHub

Library lending app. Monorepo: /backend (NestJS, Prisma, PostgreSQL),
/frontend (React, Vite, TypeScript).

## Commands

- Database: local PostgreSQL 16 service (must be running; connection in backend/.env)
- Backend dev: `cd backend && npm run start:dev`
- Backend test: `cd backend && npm test`
- Frontend dev: `cd frontend && npm run dev`
- Migrate: `cd backend && npx prisma migrate dev`

## Architecture

- One Nest module per domain: auth, books, loans, reservations, fines, members
- Controllers are thin; business rules live in services
- DTOs use class-validator; never trust request bodies
- Frontend calls the API only through /frontend/src/api/

## Business rules (source of truth: .claude/specs/)

- Max 3 active loans per member
- Loan 14 days, one renewal of +7 days, none if the book is reserved
- Fine is 1000 paise per overdue day
- Members with unpaid fines or overdue books cannot borrow

## Conventions

- Money is always integer paise, never floats
- Dates are stored in UTC
- Every new service method gets a unit test

## Hard rules

- Never edit or commit .env
- Never hand-edit Prisma migration files
- Never run destructive DB commands (drop, reset) without asking
