import { getReferredIssues } from "./parser";

describe("getReferredIssues", () => {
  it("should correctly identify closing and non-closing references", () => {
    const title = "Fixes [ABC-123]";
    const description = "This PR closes [ABC-456] and references ABC-789";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "ABC", sequence: 123 },
      { identifier: "ABC", sequence: 456 },
    ]);
    expect(result.nonClosingReferences).toEqual([{ identifier: "ABC", sequence: 789 }]);
  });

  it("should handle no references", () => {
    const title = "No references here";
    const description = "Nothing to see here";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([]);
    expect(result.nonClosingReferences).toEqual([]);
  });

  it("should handle duplicate references", () => {
    const title = "Fixes [ABC-123]";
    const description = "This PR closes ABC-123 and references ABC-123";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([{ identifier: "ABC", sequence: 123 }]);
    expect(result.nonClosingReferences).toEqual([]);
  });

  it("should handle multiple references", () => {
    const title = "Fixes [ABC-123] and [DEF-456]";
    const description = "This PR closes ABC-123 and references DEF-456";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "ABC", sequence: 123 },
      { identifier: "DEF", sequence: 456 },
    ]);
    expect(result.nonClosingReferences).toEqual([]);
  });

  it("should handle issues with no separation between them", () => {
    const title = "[WEB-123][WEB-456]";
    const description = "Refers to WEB-789WEB-1011";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "WEB", sequence: 123 },
      { identifier: "WEB", sequence: 456 },
    ]);
    expect(result.nonClosingReferences).toEqual([
      { identifier: "WEB", sequence: 789 },
      { identifier: "WEB", sequence: 1011 },
    ]);
  });
});
