import { describe, it, expect, beforeEach } from "vitest";
import { useNotesStore, type Stroke, type VirtualPage } from "./useNotesStore";

const initial = useNotesStore.getState();
const get = () => useNotesStore.getState();
const stroke = (id: string): Stroke => ({
  id,
  pageSlotId: "pdf-1",
  tool: "pen",
  color: "#000",
  baseThickness: 4,
  points: [[0, 0, 0.5]],
});

beforeEach(() => useNotesStore.setState(initial, true));

describe("strokes", () => {
  const DOC = "doc.pdf";

  it("adds and undoes strokes per document", () => {
    get().addStroke(DOC, stroke("s1"));
    get().addStroke(DOC, stroke("s2"));
    expect(get().strokes[DOC].map((s) => s.id)).toEqual(["s1", "s2"]);

    get().undoStroke(DOC);
    expect(get().strokes[DOC].map((s) => s.id)).toEqual(["s1"]);
  });

  it("removes a stroke by id", () => {
    get().addStroke(DOC, stroke("s1"));
    get().addStroke(DOC, stroke("s2"));
    get().removeStroke(DOC, "s1");
    expect(get().strokes[DOC].map((s) => s.id)).toEqual(["s2"]);
  });

  it("replaces one stroke with several (eraser split)", () => {
    get().addStroke(DOC, stroke("s1"));
    get().replaceStroke(DOC, "s1", [stroke("a"), stroke("b")]);
    expect(get().strokes[DOC].map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("clears all strokes for a document", () => {
    get().addStroke(DOC, stroke("s1"));
    get().clearStrokes(DOC);
    expect(get().strokes[DOC]).toBeUndefined();
  });

  it("undo on an empty document is a no-op", () => {
    get().undoStroke("missing.pdf");
    expect(get().strokes["missing.pdf"]).toBeUndefined();
  });
});

describe("virtual pages", () => {
  it("adds and removes virtual pages", () => {
    const vp: VirtualPage = { id: "vp1", template: "grid", afterRealPage: 1 };
    get().addVirtualPage("doc.pdf", vp);
    expect(get().virtualPages["doc.pdf"]).toHaveLength(1);
    get().removeVirtualPage("doc.pdf", "vp1");
    expect(get().virtualPages["doc.pdf"]).toEqual([]);
  });
});

describe("draw settings", () => {
  it("updates active drawing settings", () => {
    get().setDrawColor("#ff0000");
    get().setDrawThickness(8);
    get().setDrawTool("highlighter");
    get().setDrawNibAngle(30);
    get().setEraserSize(40);
    const s = get();
    expect([s.drawColor, s.drawThickness, s.drawTool, s.drawNibAngle, s.eraserSize])
      .toEqual(["#ff0000", 8, "highlighter", 30, 40]);
  });
});
