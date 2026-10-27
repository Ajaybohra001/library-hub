# NestJS Module Skill — LibraryHub Conventions

This skill defines how every feature module in LibraryHub is structured.
Load this skill before scaffolding or editing any NestJS module.

## Module File

- Import `PrismaModule` from `../prisma/prisma.module`
- Declare exactly one controller and one service
- Export the service so other modules can inject it
- No `forRoot` or dynamic module patterns

## Controller File

- Decorate with `@Controller('<resource>')` where resource is the plural noun (e.g. `books`, `loans`)
- Inject the service via constructor: `constructor(private readonly service: BooksService) {}`
- Each method calls exactly one service method — no logic in the controller
- Use `@Get()`, `@Post()`, `@Patch(':id')`, `@Delete(':id')` decorators
- Return types are inferred — no explicit `Promise<void>`
- Import `ParseIntPipe` or `ParseUUIDPipe` for path params as needed

## Service File

- Decorate with `@Injectable()`
- Inject `PrismaService` via constructor: `constructor(private readonly prisma: PrismaService) {}`
- All business logic lives here — never in the controller
- Throw `NotFoundException` for missing records (import from `@nestjs/common`)
- Throw `ConflictException` for duplicate unique fields
- Throw `BadRequestException` for invalid input that passes DTO validation
- Never return Prisma model types directly — return plain objects or typed DTOs

## DTO Files

- Live in `dto/` subfolder
- One file per operation: `create-<resource>.dto.ts`, `update-<resource>.dto.ts`, `query-<resource>.dto.ts`
- Use `class-validator` decorators: `@IsString()`, `@IsInt()`, `@IsOptional()`, `@Min()`, etc.
- Use `@Type(() => Number)` from `class-transformer` for numeric query params
- Update DTOs use `PartialType(CreateDto)` from `@nestjs/mapped-types`
- Export all DTOs from `dto/index.ts`

## Spec File

- One `describe` block named after the service class
- `beforeEach` creates the service with a mocked PrismaService
- Mock pattern:
  ```typescript
  const mockPrisma = {
    <resource>: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  ```
- One test per public service method
- Test the happy path and at least one error path per method
- Never use a real database in unit tests

## AppModule Registration

- Import the new module in `backend/src/app.module.ts`
- Add to the `imports` array — alphabetical order preferred
- Never add the service or controller directly to AppModule

## File Naming

- All files: `kebab-case`
- Classes: `PascalCase`
- The module name passed to `/new-module` is always the plural resource name
