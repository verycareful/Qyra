import { describe, it, expect } from "vitest";
import {
  CommentSchema,
  PageRangeSchema,
  PdfInfoSchema,
  PageNumberOptionsSchema,
  VirtualPageAnnotationSchema,
} from "./schemas";

describe("CommentSchema", () => {
  const valid = {
    id: "c1",
    pageIndex: 0,
    x: 1,
    y: 2,
    text: "hi",
    color: "#fff",
    resolved: false,
    createdAt: 123,
  };

  it("accepts a well-formed comment", () => {
    expect(CommentSchema.parse(valid)).toMatchObject({ id: "c1" });
  });

  it("rejects a comment missing required fields", () => {
    const { color, ...missing } = valid;
    void color;
    expect(CommentSchema.safeParse(missing).success).toBe(false);
  });
});

describe("PageRangeSchema", () => {
  it("accepts positive integer ranges", () => {
    expect(PageRangeSchema.safeParse({ start: 1, end: 3 }).success).toBe(true);
  });

  it("rejects non-positive bounds", () => {
    expect(PageRangeSchema.safeParse({ start: 0, end: 3 }).success).toBe(false);
  });
});

describe("PdfInfoSchema", () => {
  it("parses nested metadata", () => {
    const parsed = PdfInfoSchema.parse({
      page_count: 5,
      file_size: 1000,
      metadata: { title: "T" },
    });
    expect(parsed.page_count).toBe(5);
    expect(parsed.metadata.title).toBe("T");
  });
});

describe("enum-constrained schemas", () => {
  it("rejects unknown page-number positions", () => {
    expect(PageNumberOptionsSchema.safeParse({ position: "middle" }).success).toBe(false);
    expect(PageNumberOptionsSchema.safeParse({ position: "bottom-center" }).success).toBe(true);
  });

  it("rejects unknown virtual-page templates", () => {
    const base = { id: "v", afterRealPage: 0, strokes: [] };
    expect(VirtualPageAnnotationSchema.safeParse({ ...base, template: "spiral" }).success).toBe(false);
    expect(VirtualPageAnnotationSchema.safeParse({ ...base, template: "grid" }).success).toBe(true);
  });
});
