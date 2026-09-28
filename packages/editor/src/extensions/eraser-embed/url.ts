/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function isEraserUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const path = url.pathname.split("/").filter(Boolean);
    return (
      url.protocol === "https:" &&
      url.host === "app.eraser.io" &&
      !url.username &&
      !url.password &&
      path.length === 2 &&
      path[0] === "workspace" &&
      /^[A-Za-z0-9_-]+$/.test(path[1]) &&
      [...url.searchParams.keys()].every((key) => ["diagram", "figure", "layout"].includes(key)) &&
      !(url.searchParams.has("diagram") && url.searchParams.has("figure")) &&
      ["diagram", "figure"].every((key) => {
        const values = url.searchParams.getAll(key);
        return values.length === 0 || (values.length === 1 && /^[A-Za-z0-9_-]+$/.test(values[0]));
      })
    );
  } catch {
    return false;
  }
}
