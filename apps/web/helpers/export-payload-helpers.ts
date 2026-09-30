/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TWorkItemFilterExpression } from "@plane/types";

export type IssueExportProviderOption = {
  provider: string;
  delimiter?: "," | ";";
};

export type IssueExportFormPayload = {
  provider: IssueExportProviderOption;
  project: string[];
  filters: TWorkItemFilterExpression;
};

export function buildIssueExportPayload(formData: IssueExportFormPayload) {
  return {
    provider: formData.provider.provider,
    project: formData.project,
    multiple: formData.project.length > 1,
    rich_filters: formData.filters,
    ...(formData.provider.provider === "csv" && formData.provider.delimiter
      ? { delimiter: formData.provider.delimiter }
      : {}),
  };
}
