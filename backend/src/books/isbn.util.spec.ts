import { BadRequestException } from "@nestjs/common";
import { normalizeIsbn13 } from "./isbn.util";

describe("normalizeIsbn13", () => {
  it("normalizes a formatted ISBN-13", () => {
    expect(normalizeIsbn13("978-0-261-10221-7")).toBe("9780261102217");
  });

  it("rejects an invalid checksum", () => {
    expect(() => normalizeIsbn13("9780261102218")).toThrow(BadRequestException);
  });

  it("rejects an invalid prefix or length", () => {
    expect(() => normalizeIsbn13("1234567890123")).toThrow(BadRequestException);
  });
});
