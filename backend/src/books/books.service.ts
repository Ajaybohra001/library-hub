import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksDto } from './dto/list-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { normalizeIsbn13 } from './isbn.util';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async listBooks(query: ListBooksDto) {
    const search = query.q?.trim();
    const where: Prisma.BookWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search.replace(/[ -]/g, ''), mode: 'insensitive' } },
          ],
        }
      : {};
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { items: items.map((book) => this.toPublicBook(book)), page: query.page, limit: query.limit, total };
  }

  async getBookById(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return this.toPublicBook(book);
  }

  async createBook(dto: CreateBookDto) {
    const data = {
      title: dto.title.trim(),
      author: dto.author.trim(),
      isbn: normalizeIsbn13(dto.isbn),
      description: dto.description?.trim() || null,
      totalCopies: dto.totalCopies,
      availableCopies: dto.totalCopies,
    };

    try {
      const book = await this.prisma.book.create({ data });
      return this.toPublicBook(book);
    } catch (error) {
      this.throwMappedPrismaError(error);
    }
  }

  async updateBook(id: string, dto: UpdateBookDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Update body cannot be empty');
    }

    const current = await this.prisma.book.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Book not found');

    const totalCopies = dto.totalCopies ?? current.totalCopies;
    const availableCopies = current.availableCopies + (totalCopies - current.totalCopies);
    if (availableCopies < 0) {
      throw new ConflictException('Total copies cannot be below currently loaned copies');
    }

    const data: Prisma.BookUpdateInput = {
      ...(dto.title === undefined ? {} : { title: dto.title.trim() }),
      ...(dto.author === undefined ? {} : { author: dto.author.trim() }),
      ...(dto.isbn === undefined ? {} : { isbn: normalizeIsbn13(dto.isbn) }),
      ...(dto.description === undefined ? {} : { description: dto.description.trim() || null }),
      totalCopies,
      availableCopies,
    };

    try {
      const book = await this.prisma.book.update({ where: { id }, data });
      return this.toPublicBook(book);
    } catch (error) {
      this.throwMappedPrismaError(error);
    }
  }

  private toPublicBook(book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    description: string | null;
    totalCopies: number;
    availableCopies: number;
    createdAt: Date;
  }) {
    return book;
  }

  private throwMappedPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('ISBN already exists');
    }
    throw error;
  }
}
