---
description: Spawn a test-writer subagent to add missing tests for a service
argument-hint: <service file path, e.g. backend/src/books/books.service.ts>
---

Spawn a subagent to write missing unit tests for: $ARGUMENTS

The subagent should:

1. Read the target service file
2. Read the existing spec file (same folder, \*.service.spec.ts)
3. Read CLAUDE.md and .claude/skills/nest-module.md for conventions
4. Identify every public method in the service that has no test or incomplete test coverage

For each untested method, write tests that cover:

- Happy path (returns expected result)
- Not found (throws NotFoundException when record missing)
- Conflict (throws ConflictException when duplicate)
- Validation (throws BadRequestException for invalid input)
  — only the cases that apply to that method

Rules:

- Follow the mock pattern from nest-module skill exactly
- Add tests to the existing spec file, inside the existing describe block
- Do not delete existing tests
- Run `npm --prefix backend test -- --testPathPattern=<module-name>` after writing
- Report: how many tests added, final test count, pass/fail result

Do not touch any non-test files.
