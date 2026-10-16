/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * @description Error body returned by the API when a description save was based on an outdated copy
 */
export type TDescriptionConflictError = {
  code: "DESCRIPTION_CONFLICT";
  description_html: string;
};

/**
 * @description Check whether an API error is a description conflict, so it can be handled by the description input
 */
export const isDescriptionConflictError = (error: unknown): error is TDescriptionConflictError =>
  typeof error === "object" &&
  error !== null &&
  (error as Partial<TDescriptionConflictError>).code === "DESCRIPTION_CONFLICT";
