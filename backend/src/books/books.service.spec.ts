import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BooksService } from "./books.service";

const book = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  title: "The Hobbit",
  author: "J.R.R. Tolkien",
  isbn: "9780261102217",
  description: null,
  totalCopies: 3,
  availableCopies: 2,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const duplicateError = () =>
  new Prisma.PrismaClientKnownRequestError("Duplicate ISBN", {
    code: "P2002",
    clientVersion: "6.19.3",
  });

describe("BooksService", () => {
  let service: BooksService;
  let prisma: {
    book: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      book: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    service = new BooksService(prisma as never);
  });

  it("staff can create a valid book with availableCopies equal to totalCopies", async () => {
    const created = book({ totalCopies: 5, availableCopies: 5 });
    prisma.book.create.mockResolvedValue(created);

    await service.createBook({
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-0-261-10221-7",
      totalCopies: 5,
    });

    expect(prisma.book.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isbn: "9780261102217",
        totalCopies: 5,
        availableCopies: 5,
      }),
    });
  });

  it("create returns the public book and trims fields", async () => {
    const created = book({ title: "The Hobbit", author: "J.R.R. Tolkien" });
    prisma.book.create.mockResolvedValue(created);

    await expect(
      service.createBook({
        title: "  The Hobbit  ",
        author: "  J.R.R. Tolkien  ",
        isbn: "978-0-261-10221-7",
        description: "  A classic  ",
        totalCopies: 3,
      }),
    ).resolves.toEqual(created);
    expect(prisma.book.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ description: "A classic" }),
    });
  });

  it("invalid ISBN on create returns BadRequestException", async () => {
    await expect(
      service.createBook({
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "invalid",
        totalCopies: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.book.create).not.toHaveBeenCalled();
  });

  it("duplicate ISBN on create returns ConflictException", async () => {
    prisma.book.create.mockRejectedValue(duplicateError());
    await expect(
      service.createBook({
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "978-0-261-10221-7",
        totalCopies: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("increasing totalCopies increases availableCopies by the same amount", async () => {
    prisma.book.findUnique.mockResolvedValue(book());
    prisma.book.update.mockResolvedValue(
      book({ totalCopies: 5, availableCopies: 4 }),
    );
    await service.updateBook(book().id, { totalCopies: 5 });
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: book().id },
      data: expect.objectContaining({ totalCopies: 5, availableCopies: 4 }),
    });
  });

  it("reducing totalCopies below the number of loaned copies returns ConflictException", async () => {
    prisma.book.findUnique.mockResolvedValue(
      book({ totalCopies: 3, availableCopies: 1 }),
    );
    await expect(
      service.updateBook(book().id, { totalCopies: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("duplicate ISBN on update returns ConflictException", async () => {
    prisma.book.findUnique.mockResolvedValue(book());
    prisma.book.update.mockRejectedValue(duplicateError());
    await expect(
      service.updateBook(book().id, { isbn: "978-0-261-10221-7" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("update returns the public book and normalizes updated fields", async () => {
    const updated = book({
      title: "The Hobbit: Updated",
      isbn: "9780261102217",
    });
    prisma.book.findUnique.mockResolvedValue(book());
    prisma.book.update.mockResolvedValue(updated);
    await expect(
      service.updateBook(book().id, {
        title: "  The Hobbit: Updated  ",
        isbn: "978-0-261-10221-7",
      }),
    ).resolves.toEqual(updated);
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: book().id },
      data: expect.objectContaining({
        title: "The Hobbit: Updated",
        isbn: "9780261102217",
      }),
    });
  });

  it("invalid ISBN on update returns BadRequestException", async () => {
    prisma.book.findUnique.mockResolvedValue(book());
    await expect(
      service.updateBook(book().id, { isbn: "invalid" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.book.update).not.toHaveBeenCalled();
  });

  it("PATCH with an empty body returns 400 Bad Request", async () => {
    await expect(service.updateBook(book().id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("GET /books/:id returns the public book for an existing book", async () => {
    const existing = book();
    prisma.book.findUnique.mockResolvedValue(existing);
    await expect(service.getBookById(existing.id)).resolves.toEqual(existing);
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: existing.id },
    });
  });

  it("GET /books/:id returns 404 Not Found for an unknown valid UUID", async () => {
    prisma.book.findUnique.mockResolvedValue(null);
    await expect(
      service.getBookById("22222222-2222-4222-8222-222222222222"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("PATCH /books/:id returns 404 Not Found for an unknown valid UUID", async () => {
    prisma.book.findUnique.mockResolvedValue(null);
    await expect(
      service.updateBook("22222222-2222-4222-8222-222222222222", {
        title: "Updated",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists books with pagination and returns the public result shape", async () => {
    const listed = [book()];
    prisma.book.findMany.mockResolvedValue(listed);
    prisma.book.count.mockResolvedValue(1);
    prisma.$transaction.mockResolvedValue([listed, 1]);
    await expect(
      service.listBooks({ q: "hobbit", page: 2, limit: 10 }),
    ).resolves.toEqual({ items: listed, page: 2, limit: 10, total: 1 });
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: "hobbit", mode: "insensitive" } },
          { author: { contains: "hobbit", mode: "insensitive" } },
          { isbn: { contains: "hobbit", mode: "insensitive" } },
        ],
      },
      orderBy: [{ title: "asc" }, { id: "asc" }],
      skip: 10,
      take: 10,
    });
  });

  it("a whitespace-only q returns the same results as no q", async () => {
    const result = { items: [book()], page: 1, limit: 20, total: 1 };
    prisma.book.findMany.mockResolvedValue([book()]);
    prisma.book.count.mockResolvedValue(1);
    prisma.$transaction.mockResolvedValue([result.items, result.total]);
    const withoutSearch = await service.listBooks({ page: 1, limit: 20 });
    const withWhitespace = await service.listBooks({
      q: "   ",
      page: 1,
      limit: 20,
    });
    expect(withWhitespace).toEqual(withoutSearch);
    expect(prisma.book.findMany.mock.calls[0][0].where).toEqual({});
    expect(prisma.book.findMany.mock.calls[1][0].where).toEqual({});
  });
});
