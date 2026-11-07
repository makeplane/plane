/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EffortChoice, ModelCatalog, ModelChoice } from "./agent.ts";

/** Every adapter's model override: the admin-configured default model id. */
export const MODEL_ENV = "PLANE_AGENT_MODEL";

/** Every adapter's default reasoning effort, used when the model takes it (else the model's own default). */
export const EFFORT_ENV = "PLANE_AGENT_EFFORT";

/** `session/new|load` `_meta` keys for the model and effort the browser last used with this agent. */
export const INITIAL_MODEL_META_KEY = "plane/initialModel";
export const INITIAL_EFFORT_META_KEY = "plane/initialEffort";

/** Display names for the effort levels providers use; any other level is shown by its id. */
const EFFORT_NAMES: Record<string, string> = {
  none: "None",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max",
};

/** Effort choices for these level ids, in the order given (lowest first). */
export function effortChoices(
  levels: readonly string[],
  descriptions: ReadonlyMap<string, string> = new Map()
): EffortChoice[] {
  return levels.map((value) => {
    const name = EFFORT_NAMES[value] ?? value;
    const description = descriptions.get(value);
    return description ? { value, name, description } : { value, name };
  });
}

/**
 * Build a catalog from the adapter's known models, starting on `PLANE_AGENT_MODEL` when set. An
 * override that is not in the list is added at the top, so new provider models work without a
 * release; it takes the provider's usual efforts (`unlisted`).
 */
export function modelCatalog(
  known: readonly ModelChoice[],
  env: NodeJS.ProcessEnv,
  unlisted: Pick<ModelChoice, "efforts" | "defaultEffort"> = {}
): ModelCatalog {
  const override = env[MODEL_ENV]?.trim();
  const fallback = known[0]?.value ?? "";
  if (!override) return { options: known, current: fallback };
  const options = known.some((choice) => choice.value === override)
    ? known
    : [{ value: override, name: override, ...unlisted }, ...known];
  return { options, current: override };
}

export function findModel(catalog: ModelCatalog, model: string): ModelChoice | undefined {
  return catalog.options.find((choice) => choice.value === model);
}

/**
 * The effort a model runs at: the first of `preferred` it takes, else its default, else its first
 * level. `undefined` for a model that takes no effort.
 */
export function resolveEffort(
  model: ModelChoice | undefined,
  ...preferred: readonly (string | undefined)[]
): string | undefined {
  const efforts = model?.efforts ?? [];
  if (efforts.length === 0) return undefined;
  const takes = (value: string | undefined): value is string =>
    !!value && efforts.some((choice) => choice.value === value);
  return preferred.find(takes) ?? (takes(model?.defaultEffort) ? model?.defaultEffort : efforts[0]?.value);
}
