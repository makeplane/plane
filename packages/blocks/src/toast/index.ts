/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export { dismissToast, setPromiseToast, setToast, toastManager, updateToast } from "./toast-manager";
export type { PromiseToastData, PromiseToastOptions, SetToastProps, ToastActionItem, ToastType } from "./toast-manager";
export { PlaneToastProvider } from "./plane-toast-provider";
export type { PlaneToastProviderProps } from "./plane-toast-provider";

/**
 * @deprecated Transitional shim so call sites keep compiling until the F4 codemod rewrites every
 * `TOAST_TYPE.X` to its string literal. Removed by that codemod commit — do not use.
 */
export const TOAST_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
  LOADING: "loading",
  LOADING_TOAST: "loading-toast",
} as const;
