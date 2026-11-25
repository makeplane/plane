/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TIssue, TProductIndicator, TProductPayload } from "@plane/types";

type TErrors = Record<string, unknown> | undefined;

/** Translation key for a rejected product change. The API answers in English. */
export const getProductErrorKey = (error: unknown): string => {
  const errors = error as TErrors;
  const text = JSON.stringify(errors ?? "");
  if (text.includes("NAME_ALREADY_EXISTS")) return "team_structure.errors.name_taken";
  if (text.includes("PRODUCT_TYPE_IN_USE")) return "product.errors.type_in_use";
  if (text.includes("Unlink the work items")) return "product.errors.has_items";
  if (text.includes("with a parent cannot become")) return "product.errors.has_parent";
  if (text.includes("from its cycle and modules")) return "product.errors.in_cycle";
  if (text.includes("cannot have a parent")) return "product.errors.no_parent";
  if (text.includes("owner must be")) return "product.errors.owner";
  if (text.includes("product type is not available")) return "product.errors.type_unavailable";
  if (text.includes("needs") || text.includes("Start date cannot")) return "product.errors.required";
  return "something_went_wrong_please_try_again";
};

/** What the form still lacks to save a product. */
export const isProductComplete = (
  product: TProductPayload | null | undefined,
  dates: Pick<TIssue, "start_date" | "target_date">
): boolean => !!product?.product_type_id && !!product.owner_id && !!dates.start_date && !!dates.target_date;

export const INDICATOR_VARIANTS = {
  completed: "success",
  cancelled: "neutral",
  overdue: "danger",
  at_risk: "warning",
  not_started: "neutral",
  on_track: "brand",
} as const satisfies Record<TProductIndicator, string>;

/** Whether the dates of a work item leave the dates of its product. */
export const isOutsideProductDates = (
  issue: Pick<TIssue, "start_date" | "target_date">,
  product: Pick<TIssue, "start_date" | "target_date">
): boolean => {
  const { start_date: from, target_date: to } = product;
  return [issue.start_date, issue.target_date].some(
    (date) => !!date && ((!!from && date < from) || (!!to && date > to))
  );
};
