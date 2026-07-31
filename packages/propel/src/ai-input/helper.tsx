/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface AIInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Input visual mode */
  mode?: "primary" | "transparent";
  inputSize?: "xs" | "sm" | "md";
  hasError?: boolean;
  /** Ghost suggestion text shown below the input. Tab key accepts it. */
  suggestion?: string;
  /** Show loading spinner instead of AI icon */
  isLoading?: boolean;
  /** Called when the user accepts the suggestion (Tab key) */
  onAcceptSuggestion?: (suggestion: string) => void;
  onChange?: (value: string) => void;
}
