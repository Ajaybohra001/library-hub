# LibraryHub

LibraryHub is a library book-lending web app with a NestJS API, React frontend, Prisma ORM, and locally installed PostgreSQL.

## Structure

```text
backend/       NestJS + Prisma API
  prisma/      PostgreSQL schema and migrations
  src/         API modules and bootstrap
frontend/      React + Vite client
.env.example   Local configuration template
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL installed and running locally

Create a PostgreSQL database named `library_hub`, then copy `.env.example` to `.env` and update credentials if needed.

## Run

```bash
npm install --prefix backend
npm install --prefix frontend
npm run db:generate
npm run db:migrate
npm run dev:backend
npm run dev:frontend
```

The API is available at `http://localhost:3000/api/health`; the frontend runs at `http://localhost:5173`.

No Docker setup is required. Prisma reads `DATABASE_URL` from `.env` and connects directly to the local PostgreSQL service.
