import { describe, it, expect } from "vitest";
import {
  shouldSuppressEvent,
  canDragBasedOnSelection,
  nextExpandState,
  getDragDisallowedToast,
} from "../../../apps/web/core/components/issues/issue-layouts/list/block.logic";

/**
 * Tests for logic extracted from the list block component
 */
describe("block.logic", () => {
  describe("shouldSuppressEvent", () => {
    it("returns true when selection text exists", () => {
      expect(shouldSuppressEvent("hello")).toBe(true);
    });

    it("returns false when selection text is empty", () => {
      expect(shouldSuppressEvent("")).toBe(false);
    });

    it("returns false when selection text is null", () => {
      expect(shouldSuppressEvent(null)).toBe(false);
    });
  });
  describe("canDragBasedOnSelection", () => {
    it("disallows drag when selection text exists", () => {
      expect(canDragBasedOnSelection("selected text", true)).toBe(false);
    });

    it("allows drag when no selection and isAllowed is true", () => {
      expect(canDragBasedOnSelection(null, true)).toBe(true);
    });

    it("disallows drag when no selection but isAllowed is false", () => {
      expect(canDragBasedOnSelection(null, false)).toBe(false);
    });
  });
  describe("nextExpandState", () => {
    it("toggles expand state when nesting level < 3", () => {
      expect(nextExpandState(1, false)).toBe(true);
      expect(nextExpandState(2, true)).toBe(false);
    });

    it("keeps expand state when nesting level >= 3", () => {
      expect(nextExpandState(3, false)).toBe(false);
      expect(nextExpandState(4, true)).toBe(true);
    });
  });
  describe("getDragDisallowedToast", () => {
    it("returns null when drag is allowed", () => {
      expect(getDragDisallowedToast(true, true)).toBeNull();
    });

    it("returns correct toast when drag is disallowed but user can edit", () => {
      const toast = getDragDisallowedToast(false, true);
      expect(toast).toEqual({
        title: "Cannot move work item",
        message: "Drag and drop is disabled for the current grouping",
      });
    });

    it("returns correct toast when drag is disallowed and user cannot edit", () => {
      const toast = getDragDisallowedToast(false, false);
      expect(toast).toEqual({
        title: "Cannot move work item",
        message: "You are not allowed to move this work item",
      });
    });
  });
});
