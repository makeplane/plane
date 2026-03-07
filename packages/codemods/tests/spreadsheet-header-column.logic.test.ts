import { describe, it, expect } from "vitest";
import {
  getHeaderColumnWidth,
  HEADER_COLUMN_WIDTHS,
} from "../../../apps/web/core/components/issues/issue-layouts/spreadsheet/spreadsheet-header-column.logic";

describe("spreadsheet-header-column.logic", () => {
  describe("getHeaderColumnWidth", () => {
    it("returns correct width for known properties", () => {
      for (const key of Object.keys(HEADER_COLUMN_WIDTHS) as Array<
        keyof typeof HEADER_COLUMN_WIDTHS
      >) {
        expect(getHeaderColumnWidth(key)).toBe(HEADER_COLUMN_WIDTHS[key]);
      }
    });

    it("returns auto for unknown properties", () => {
      // @ts-expect-error testing fallback
      expect(getHeaderColumnWidth("unknown")).toBe("auto");
    });
  });
});
