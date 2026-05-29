import { describe, it, expect, beforeEach } from "vitest";
import { useCommentsStore, type Comment } from "./useCommentsStore";

const initial = useCommentsStore.getState();
const get = () => useCommentsStore.getState();
const DOC = "doc.pdf";
const comment = (id: string): Comment => ({
  id,
  pageIndex: 0,
  x: 10,
  y: 20,
  text: "note",
  color: "#f59e0b",
  resolved: false,
  createdAt: 1,
});

beforeEach(() => useCommentsStore.setState(initial, true));

describe("comments store", () => {
  it("loads a comment list for a document", () => {
    get().loadComments(DOC, [comment("c1"), comment("c2")]);
    expect(get().comments[DOC]).toHaveLength(2);
  });

  it("adds a comment", () => {
    get().addComment(DOC, comment("c1"));
    expect(get().comments[DOC].map((c) => c.id)).toEqual(["c1"]);
  });

  it("updates fields of a comment by id", () => {
    get().addComment(DOC, comment("c1"));
    get().updateComment(DOC, "c1", { text: "edited", resolved: true });
    const c = get().comments[DOC][0];
    expect(c.text).toBe("edited");
    expect(c.resolved).toBe(true);
  });

  it("removes a comment by id", () => {
    get().loadComments(DOC, [comment("c1"), comment("c2")]);
    get().removeComment(DOC, "c1");
    expect(get().comments[DOC].map((c) => c.id)).toEqual(["c2"]);
  });

  it("clears all comments for a document", () => {
    get().addComment(DOC, comment("c1"));
    get().clearComments(DOC);
    expect(get().comments[DOC]).toBeUndefined();
  });
});
