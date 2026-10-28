import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const books = [
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    isbn: "9780385534635",
    description:
      "A spellbinding competition between two young magicians in a mysterious circus.",
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: "A Gentleman in Moscow",
    author: "Amor Towles",
    isbn: "9780143110439",
    description:
      "A Russian aristocrat discovers a lifetime of meaning while confined to a grand hotel.",
    totalCopies: 2,
    availableCopies: 2,
  },
  {
    title: "The Vanishing Half",
    author: "Brit Bennett",
    isbn: "9780525536291",
    description:
      "Twin sisters take radically different paths in a story about identity and family.",
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    description:
      "A sweeping history of humankind from the Stone Age to the modern era.",
    totalCopies: 5,
    availableCopies: 5,
  },
  {
    title: "The Hidden Life of Trees",
    author: "Peter Wohlleben",
    isbn: "9781771642484",
    description:
      "An accessible exploration of the social networks and lives of forests.",
    totalCopies: 2,
    availableCopies: 2,
  },
  {
    title: "The Code Book",
    author: "Simon Singh",
    isbn: "9780385495325",
    description:
      "The history of codes and code-breaking from ancient times to the digital age.",
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: "The Silk Roads",
    author: "Peter Frankopan",
    isbn: "9781101912379",
    description:
      "A connected history of the world shaped by the trade routes of Eurasia.",
    totalCopies: 1,
    availableCopies: 1,
  },
  {
    title: "The Innovators",
    author: "Walter Isaacson",
    isbn: "9781476708706",
    description:
      "The people who created the digital revolution and transformed the modern world.",
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399590504",
    description:
      "A memoir about education, family, and the struggle to find a voice.",
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: "The Immortal Life of Henrietta Lacks",
    author: "Rebecca Skloot",
    isbn: "9781400052189",
    description:
      "The story of the woman whose cells changed medical research forever.",
    totalCopies: 2,
    availableCopies: 2,
  },
];

async function main() {
  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: book,
      create: book,
    });
    console.log(`Seeded: ${book.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
