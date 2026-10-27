---
description: Scaffold a NestJS feature module following LibraryHub conventions
argument-hint: <module-name e.g. loans, auth, fines>
---

You are scaffolding a new NestJS feature module named "$ARGUMENTS" inside the LibraryHub monorepo.

First, read these files for context:

- CLAUDE.md (project rules and conventions)
- backend/src/books/books.module.ts
- backend/src/books/books.controller.ts
- backend/src/books/books.service.ts

Then create the following files under backend/src/$ARGUMENTS/:

1. **$ARGUMENTS.module.ts** — imports PrismaModule, declares the controller and service, exports the service
2. **$ARGUMENTS.controller.ts** — thin controller with `@Controller('$ARGUMENTS')`, no business logic
3. **$ARGUMENTS.service.ts** — service with `constructor(private prisma: PrismaService) {}`, no methods yet
4. **dto/index.ts** — empty barrel export file (`export {};`)
5. **$ARGUMENTS.service.spec.ts** — one test: `it('should be defined', () => { expect(service).toBeDefined(); })`

After creating files:

- Register the new module in backend/src/app.module.ts imports array
- Run `cd backend && npm test -- --testPathPattern=$ARGUMENTS` and show the result
- List every file created or modified

Rules (from CLAUDE.md):

- Controllers are thin — no business logic
- Business logic lives in services
- DTOs use class-validator decorators
- Do NOT create migrations or edit prisma/schema.prisma
- Do NOT commit anything
