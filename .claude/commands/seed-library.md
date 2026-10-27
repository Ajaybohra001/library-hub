---
description: Seed the database with sample books for development and testing
---

Seed the LibraryHub development database with realistic sample data.

Read CLAUDE.md first for database and project rules.

Using the Prisma client, create a seed script at backend/prisma/seed.ts that inserts:

- 10 books with realistic titles, authors, ISBNs (valid ISBN-13), genres, and copy counts
- Use genres: FICTION, NON_FICTION, SCIENCE, HISTORY, TECHNOLOGY, BIOGRAPHY
- Each book should have totalCopies between 1–5, availableCopies = totalCopies

The seed script must:

- Use `upsert` with isbn as the unique key (safe to run multiple times)
- Import PrismaClient directly (not the NestJS service)
- Log each book title as it's inserted

After creating the script:

1. Add to backend/package.json under `"prisma"`: `"seed": "ts-node prisma/seed.ts"`
2. Run `cd backend && npx prisma db seed`
3. Then run `cd backend && curl -s http://localhost:3000/api/books | npx json` to verify books appear
4. Report how many books were seeded

Rules:

- Never edit migration files
- Never hardcode DATABASE_URL — use the .env file automatically via Prisma
