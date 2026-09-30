/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { EXPORTERS_LIST } from "@plane/constants";
import { buildIssueExportPayload } from "../../helpers/export-payload-helpers";

describe("export format constants", () => {
  it("exposes csv comma and semicolon variants for work item export", () => {
    const csvFormats = EXPORTERS_LIST.filter((format) => format.provider === "csv");

    expect(csvFormats).toHaveLength(2);
    expect(csvFormats.map((format) => format.delimiter)).toEqual([",", ";"]);
  });
});

describe("export payload helpers", () => {
  it("includes delimiter only for csv issue export", () => {
    expect(
      buildIssueExportPayload({
        provider: { provider: "csv", delimiter: ";" },
        project: ["project-1"],
        filters: {},
      })
    ).toEqual({
      provider: "csv",
      project: ["project-1"],
      multiple: false,
      rich_filters: {},
      delimiter: ";",
    });

    expect(
      buildIssueExportPayload({
        provider: { provider: "xlsx" },
        project: ["project-1", "project-2"],
        filters: { priority__exact: "high" },
      })
    ).toEqual({
      provider: "xlsx",
      project: ["project-1", "project-2"],
      multiple: true,
      rich_filters: { priority__exact: "high" },
    });
  });
});
