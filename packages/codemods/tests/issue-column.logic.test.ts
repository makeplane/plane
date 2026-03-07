import { describe, it, expect, vi } from "vitest";
import {
  getColumnWidth,
  handleUpdateIssueLogic,
  COLUMN_WIDTHS,
} from "../../../apps/web/core/components/issues/issue-layouts/spreadsheet/issue-column.logic";
import type { TIssue } from "@plane/types";

describe("issue-column.logic", () => {
  describe("getColumnWidth", () => {
    it("returns the correct width for known properties", () => {
      for (const key of Object.keys(COLUMN_WIDTHS) as Array<
        keyof typeof COLUMN_WIDTHS
      >) {
        expect(getColumnWidth(key)).toBe(COLUMN_WIDTHS[key]);
      }
    });

    it("returns auto for unknown properties", () => {
      // @ts-expect-error testing fallback
      expect(getColumnWidth("unknown")).toBe("auto");
    });
  });

  describe("handleUpdateIssueLogic", () => {
    const issue = {
      id: "123",
      project_id: "p1",
    } as unknown as TIssue;

    it("does nothing when updateIssue is undefined", async () => {
      const result = await handleUpdateIssueLogic(undefined, issue, {
        name: "x",
      });
      expect(result).toBeUndefined();
    });

    it("calls updateIssue with correct arguments", async () => {
      const mock = vi.fn().mockResolvedValue(undefined);

      await handleUpdateIssueLogic(mock, issue, { name: "New Name" });

      expect(mock).toHaveBeenCalledWith("p1", "123", { name: "New Name" });
    });
  });
});
