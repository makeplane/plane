import { getReferredIssues } from "./parser";

describe("getReferredIssues", () => {
  it("should correctly identify closing and non-closing references", () => {
    const title = "Fixes [ABC-123]";
    const description = "This PR closes [ABC-456] and references ABC-789";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "ABC", sequence: 123, isClosing: true },
      { identifier: "ABC", sequence: 456, isClosing: true },
    ]);
    expect(result.nonClosingReferences).toEqual([{ identifier: "ABC", sequence: 789, isClosing: false }]);
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

    expect(result.closingReferences).toEqual([{ identifier: "ABC", sequence: 123, isClosing: true }]);
    expect(result.nonClosingReferences).toEqual([]);
  });

  it("should handle multiple references", () => {
    const title = "Fixes [ABC-123] and [DEF-456]";
    const description = "This PR closes ABC-123 and references DEF-456";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "ABC", sequence: 123, isClosing: true },
      { identifier: "DEF", sequence: 456, isClosing: true },
    ]);
    expect(result.nonClosingReferences).toEqual([]);
  });

  it("should handle issues with no separation between them", () => {
    const title = "[WEB-123][WEB-456]";
    const description = "Refers to WEB-789WEB-1011";
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([
      { identifier: "WEB", sequence: 123, isClosing: true },
      { identifier: "WEB", sequence: 456, isClosing: true },
    ]);
    expect(result.nonClosingReferences).toEqual([
      { identifier: "WEB", sequence: 789, isClosing: false },
      { identifier: "WEB", sequence: 1011, isClosing: false },
    ]);
  });

  it("should correctly handle duplicate closing and non-closing references", () => {
    const title = "[WEB-4075] fix: member issue";
    const description = `
  [WEB-4075](https://app.plane.so/plane/browse/WEB-4075/)
  // references WEB-4066, WEB-4066
  `;
    const result = getReferredIssues(title + "\n" + description);

    expect(result.closingReferences).toEqual([{ identifier: "WEB", sequence: 4075, isClosing: true }]);
    expect(result.nonClosingReferences).toEqual([{ identifier: "WEB", sequence: 4066, isClosing: false }]);
  });
});
