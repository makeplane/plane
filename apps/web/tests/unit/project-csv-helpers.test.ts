/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getProjectImportLink, MAX_PROJECT_CSV_SIZE_BYTES } from "../../helpers/project-csv-helpers";

describe("project-csv-helpers", () => {
  it("exposes a positive upload size limit", () => {
    expect(MAX_PROJECT_CSV_SIZE_BYTES).toBeGreaterThan(0);
  });

  it("builds project link after import", () => {
    expect(getProjectImportLink("acme", "project-1")).toBe("/acme/projects/project-1/issues");
  });
});
