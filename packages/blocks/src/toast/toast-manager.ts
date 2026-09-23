/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createToastManager } from "@makeplane/propel/components/toast";
import type { ToastAction, ToastData, ToastVariant } from "@makeplane/propel/components/toast";
import type { ReactNode } from "react";

/**
 * The imperative toast API Plane has always used, re-homed on Propel's toast manager. The exported
 * signatures deliberately mirror the previous `@plane/propel/toast` module one-for-one so the ~650
 * call sites change nothing but their import path.
 */

/** Legacy toast intents. `loading-toast` is the titled, persistent sibling of `loading`. */
export type ToastType = "success" | "error" | "info" | "warning" | "loading" | "loading-toast";

/**
 * A toast action expressed as data (label + handler, or label + href). Propel's toast is a closed,
 * portaled surface with no markup escape hatch, so actions cross the boundary as data.
 *
 * Propel renders at most **three**: `data.actions.slice(0, 2)` as the left cluster plus one
 * right-aligned `data.primaryAction`. Set `primary` on the item that should take that right-hand
 * slot; everything else fills the left cluster in order.
 */
export type ToastActionItem = ToastAction & {
  /**
   * Route this item to Propel's right-aligned `primaryAction` slot instead of the left cluster.
   * Only the first flagged item is used; later ones fall back to the cluster.
   */
  primary?: boolean;
};

/** Propel's left action cluster renders at most two buttons; extras are dropped by the component. */
const MAX_LEFT_ACTIONS = 2;

export type SetToastProps =
  | {
      type: "loading";
      title?: string;
    }
  | {
      id?: string | number;
      type: Exclude<ToastType, "loading">;
      title: string;
      message?: string;
      /**
       * Prefer `ToastActionItem[]` — Propel renders those as on-token buttons/links. The
       * `ReactNode` arm only exists so pre-Propel call sites keep compiling; arbitrary markup
       * cannot be rendered inside Propel's toast and is dropped.
       */
      actionItems?: ReactNode | ToastActionItem[];
    };

type PromiseToastCallback<TData> = (data: TData) => string | undefined;
type ActionItemsPromiseToastCallback<TData> = (data: TData) => ReactNode | ToastActionItem[];

export type PromiseToastData<TData> = {
  title: string;
  message?: PromiseToastCallback<TData>;
  actionItems?: ActionItemsPromiseToastCallback<TData>;
};

export type PromiseToastOptions<TData> = {
  loading?: string;
  success: PromiseToastData<TData>;
  error: PromiseToastData<TData>;
};

const DEFAULT_LOADING_TITLE = "Loading...";

const VARIANT_BY_TYPE: Record<ToastType, ToastVariant> = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "info",
  loading: "neutral",
  "loading-toast": "neutral",
};

// Safely detects a non-production build without requiring @types/node. Evaluated once at module
// load time; bundlers can tree-shake the dev blocks.
const __DEV__ = (() => {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  return proc ? proc.env?.NODE_ENV !== "production" : false;
})();

/** Types that report work in flight: they stay up until `dismissToast` or an `updateToast`. */
const PERSISTENT_TYPES: ReadonlySet<ToastType> = new Set<ToastType>(["loading", "loading-toast"]);

/**
 * Spread into a toast payload to control auto-dismiss. Persistent types get `timeout: 0`; every
 * other type contributes **no `timeout` key at all**.
 *
 * The absence matters. Propel's manager wrapper builds `{ priority, timeout: derived, ...options }`
 * on add — so an own `timeout: undefined` would win the spread and wipe the 8s it derives for
 * `danger`/`warning` — and on update it skips its derived timeout whenever
 * `Object.hasOwn(options, "timeout")`, which an undefined-valued own property satisfies.
 */
const timeoutFor = (type: ToastType): { timeout?: 0 } => (PERSISTENT_TYPES.has(type) ? { timeout: 0 } : {});

const isToastActionItem = (value: unknown): value is ToastActionItem =>
  typeof value === "object" && value !== null && typeof (value as ToastActionItem).label === "string";

const describeActionItems = (actionItems: unknown): string => {
  if (Array.isArray(actionItems)) return `an array of ${actionItems.length} non-action value(s)`;
  return `a value of type ${typeof actionItems}`;
};

/**
 * Narrows the legacy `actionItems` value to the data actions Propel can render, and splits them
 * across the two slots the component exposes: the left `actions` cluster and the right-aligned
 * `primaryAction`. Markup — which the old, plane-owned toast accepted — has no home in Propel's
 * closed surface, so it is dropped with a dev-only warning that names the offending value.
 */
const toActionSlots = (
  actionItems: ReactNode | ToastActionItem[]
): { actions?: ToastActionItem[]; primaryAction?: ToastActionItem } => {
  // The ReactNode values that render nothing: the caller meant "no actions", not a mistake.
  if (actionItems == null || actionItems === false || actionItems === "") return {};
  if (Array.isArray(actionItems)) {
    if (actionItems.length === 0) return {};
    if (actionItems.every(isToastActionItem)) {
      const primaryIndex = actionItems.findIndex((item) => item.primary === true);
      const primaryAction = primaryIndex >= 0 ? actionItems[primaryIndex] : undefined;
      const left = primaryIndex >= 0 ? actionItems.filter((_, i) => i !== primaryIndex) : [...actionItems];

      if (__DEV__ && left.length > MAX_LEFT_ACTIONS) {
        console.warn(
          `[@plane/blocks/toast] Toast passed ${actionItems.length} action items but Propel renders ` +
            `at most ${MAX_LEFT_ACTIONS} in the left cluster plus one \`primary\` item. ` +
            `Dropping: ${left
              .slice(MAX_LEFT_ACTIONS)
              .map((item) => JSON.stringify(item.label))
              .join(", ")}. Mark one item \`primary: true\` or merge two of them.`
        );
      }

      return {
        actions: left.length > 0 ? left.slice(0, MAX_LEFT_ACTIONS) : undefined,
        primaryAction,
      };
    }
  }
  if (__DEV__) {
    console.warn(
      `[@plane/blocks/toast] Dropped \`actionItems\`: got ${describeActionItems(actionItems)}. ` +
        "Propel's toast renders actions as data, not markup, so JSX action items cannot be shown. " +
        'Pass `ToastActionItem[]` instead, e.g. [{ label: "View cycle", href: "/…" }] or ' +
        '[{ label: "View cycle", onClick }].'
    );
  }
  return {};
};

const toastDataFor = (type: ToastType, actionItems?: ReactNode | ToastActionItem[]): ToastData => ({
  variant: VARIANT_BY_TYPE[type],
  ...toActionSlots(actionItems),
});

export const toastManager = createToastManager<ToastData>();

/** Queues a toast and returns its id, which `updateToast` / `dismissToast` accept. */
export const setToast = (props: SetToastProps): string => {
  if (props.type === "loading") {
    return toastManager.add({
      title: props.title ?? DEFAULT_LOADING_TITLE,
      ...timeoutFor(props.type),
      data: toastDataFor(props.type),
    });
  }
  return toastManager.add({
    id: props.id?.toString(),
    title: props.title,
    description: props.message,
    ...timeoutFor(props.type),
    data: toastDataFor(props.type, props.actionItems),
  });
};

/** Rewrites an existing toast in place — used to settle a `loading-toast` into its outcome. */
export const updateToast = (id: string, props: SetToastProps): void => {
  if (props.type === "loading") {
    toastManager.update(id, {
      title: props.title ?? DEFAULT_LOADING_TITLE,
      ...timeoutFor(props.type),
      data: toastDataFor(props.type),
    });
    return;
  }
  toastManager.update(id, {
    title: props.title,
    description: props.message,
    ...timeoutFor(props.type),
    data: toastDataFor(props.type, props.actionItems),
  });
};

/**
 * Shows a loading toast for the life of `promise`, then swaps it for a success or error toast.
 * Returns `void` (not the promise) so call sites stay plain statements.
 */
export const setPromiseToast = <TData>(promise: Promise<TData>, options: PromiseToastOptions<TData>): void => {
  void toastManager.promise(promise, {
    loading: {
      title: options.loading ?? DEFAULT_LOADING_TITLE,
      ...timeoutFor("loading"),
      data: toastDataFor("loading"),
    },
    success: (data: TData) => ({
      title: options.success.title,
      description: options.success.message?.(data),
      ...timeoutFor("success"),
      data: toastDataFor("success", options.success.actionItems?.(data)),
    }),
    // Matches the previous module: the error callbacks are typed against the resolved value.
    error: (error: TData) => ({
      title: options.error.title,
      description: options.error.message?.(error),
      ...timeoutFor("error"),
      data: toastDataFor("error", options.error.actionItems?.(error)),
    }),
  });
};

/** Closes the toast with the given id. */
export const dismissToast = (tId: string): void => {
  toastManager.close(tId);
};
