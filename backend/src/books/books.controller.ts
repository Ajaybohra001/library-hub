import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StaffGuard } from '../common/guards/staff.guard';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksDto } from './dto/list-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  list(@Query() query: ListBooksDto) {
    return this.booksService.listBooks(query);
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.booksService.getBookById(id);
  }

  @Post()
  @UseGuards(StaffGuard)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.createBook(dto);
  }

  @Patch(':id')
  @UseGuards(StaffGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(id, dto);
  }
}
