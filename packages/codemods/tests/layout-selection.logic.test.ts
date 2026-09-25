import { describe, it, expect } from "vitest";
import {
  getLayoutFromUrl,
  setLayoutInQuery,
} from "../../../apps/web/core/components/issues/issue-layouts/filters/header/layout-selection.logic";

describe("layout-selection.logic", () => {
  describe("getLayoutFromUrl", () => {
    it("returns the layout when valid", () => {
      const result = getLayoutFromUrl("?layout=list", ["list", "kanban"]);
      expect(result).toBe("list");
    });

    it("returns null when layout is missing", () => {
      const result = getLayoutFromUrl("?foo=bar", ["list"]);
      expect(result).toBeNull();
    });

    it("returns null when layout is invalid", () => {
      const result = getLayoutFromUrl("?layout=unknown", ["list"]);
      expect(result).toBeNull();
    });
  });

  describe("setLayoutInQuery", () => {
    it("updates the layout in the query string", () => {
      const result = setLayoutInQuery("?foo=bar", "list");
      expect(result).toBe("foo=bar&layout=list");
    });

    it("overwrites an existing layout", () => {
      const result = setLayoutInQuery("?layout=kanban", "list");
      expect(result).toBe("layout=list");
    });
  });
});
