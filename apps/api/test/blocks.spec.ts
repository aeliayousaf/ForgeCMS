import { pageDocumentSchema } from "@forgecms/shared";

describe("page document schema", () => {
  it("accepts a valid document", () => {
    const doc = {
      version: 1,
      blocks: [{ id: "a", type: "hero", props: { title: "Hi" } }],
    };
    expect(pageDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it("rejects an unknown block type", () => {
    const doc = {
      version: 1,
      blocks: [{ id: "a", type: "not-a-block", props: {} }],
    };
    expect(pageDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it("rejects a wrong version", () => {
    expect(pageDocumentSchema.safeParse({ version: 2, blocks: [] }).success).toBe(false);
  });
});
