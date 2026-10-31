/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Flattens an API error body (`{ error }` or `{ field: [messages] }`) into one readable sentence. */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Object) {
    const body = error as Record<string, unknown>;
    // Plane's own errors carry one sentence in `error`; DRF's carry `detail` or a list per field.
    for (const key of ["error", "detail"]) {
      if (typeof body[key] === "string") return body[key];
    }
    const messages = Object.values(body)
      .flat()
      .filter((value): value is string => typeof value === "string");
    if (messages.length > 0) return messages.join(" ");
  }
  return "Something went wrong. Try again.";
};
