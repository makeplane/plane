/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";

/**
 * Tells `Select.Trigger` which host it is rendering into. `SelectRoot` publishes it; a hand-rolled
 * `SelectContext.Provider` (e.g. `release-select`, still on the legacy propel Combobox) does not,
 * and `null` is that "not the propel engine" signal — see `SelectTrigger`.
 */
export type SelectEngineContextValue = {
  /**
   * Whether the base-ui Combobox root is mounted around the trigger. `false` is the `lazyMount`
   * resting state: no Root, no popup, just a cheap button that mounts them on activation.
   */
  mounted: boolean;
  /** Mounts the base-ui Root and opens the popup in one action. */
  activate: () => void;
  /**
   * Mounts the base-ui Root WITHOUT opening the popup — for a trigger that has no resting form at
   * all, since `variant="search-input"`'s chips field is itself a base-ui part. Such a trigger
   * mounts the Root on its first render rather than leaving every caller to pass
   * `lazyMount={false}`. Optional: a hand-rolled host without that variant (`release-select`) has
   * no use for it.
   */
  mount?: () => void;
  /**
   * The root's `disabled`. In the resting state there is no base-ui Root to push it down to the
   * trigger, so the trigger reads it from here.
   */
  disabled: boolean;
};

// Mirrors select/context.ts: context + hook only (no Provider component) so
// react(only-export-components) stays quiet under pre-commit --deny-warnings.
export const SelectEngineContext = createContext<SelectEngineContextValue | null>(null);

export function useSelectEngine(): SelectEngineContextValue | null {
  return useContext(SelectEngineContext);
}
