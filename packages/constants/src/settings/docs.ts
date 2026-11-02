/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Help-center pages that settings headings link to with a "Docs" button. */
export const SETTINGS_DOCS_URLS = {
  // workspace
  exports: "https://docs.plane.so/core-concepts/export#export-data",
  webhooks: "https://docs.plane.so/dev-tools/intro-webhooks",
  // project
  states: "https://docs.plane.so/core-concepts/issues/states",
  labels: "https://docs.plane.so/core-concepts/issues/labels",
  estimates: "https://docs.plane.so/core-concepts/issues/estimates",
  cycles: "https://docs.plane.so/core-concepts/cycles",
  modules: "https://docs.plane.so/core-concepts/modules",
  views: "https://docs.plane.so/core-concepts/views",
  pages: "https://docs.plane.so/core-concepts/pages/overview",
  intake: "https://docs.plane.so/core-concepts/intake",
} as const;
