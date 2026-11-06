/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ModelCatalog, ModelChoice } from "./agent.ts";

/** Every adapter's model override: the admin-configured default model id. */
export const MODEL_ENV = "PLANE_AGENT_MODEL";

/**
 * Build a catalog from the adapter's known models, starting on `PLANE_AGENT_MODEL` when set. An
 * override that is not in the list is added at the top, so new provider models work without a
 * release.
 */
export function modelCatalog(known: readonly ModelChoice[], env: NodeJS.ProcessEnv): ModelCatalog {
  const override = env[MODEL_ENV]?.trim();
  const fallback = known[0]?.value ?? "";
  if (!override) return { options: known, current: fallback };
  const options = known.some((choice) => choice.value === override)
    ? known
    : [{ value: override, name: override }, ...known];
  return { options, current: override };
}
