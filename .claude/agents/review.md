---
description: Spawn a code-reviewer subagent to review a file or module
argument-hint: <file-or-folder path, e.g. backend/src/books>
---

Spawn a subagent to do a focused code review of: $ARGUMENTS

The subagent should:

1. Read every file in the target path
2. Read CLAUDE.md for project rules
3. Review against these checklists:

**Architecture:**

- [ ] Controllers are thin (no business logic)
- [ ] Business logic is in services only
- [ ] DTOs use class-validator decorators
- [ ] No raw Prisma types returned from service methods

**Security:**

- [ ] No secrets or credentials in code
- [ ] Auth guards applied to write endpoints
- [ ] No SQL injection risk (Prisma parameterizes, but check raw queries)

**NestJS conventions:**

- [ ] Injectable decorators present
- [ ] Module imports/exports correct
- [ ] Exception types match the situation (Not Found, Conflict, Bad Request)

**Tests:**

- [ ] At least one test per service method
- [ ] Happy path and one error path per method
- [ ] No real database used in unit tests
- [ ] Mock pattern matches nest-module skill

The subagent must return a structured report:

- **PASS** or **FAIL** overall
- List of issues found (file, line, description, severity: HIGH/MEDIUM/LOW)
- List of items that passed
- One suggested fix for each HIGH severity issue

Do not modify any files. Report only.
