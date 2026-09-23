/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IconElement } from "../types/icon";
import type { Align } from "../utils/placement";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";

/**
 * propel: kept verbatim from the deleted in-repo Propel button so `EmptyState`'s public action
 * API is unchanged; `./action-button` maps these onto Propel's six variants.
 */
export type ButtonVariant =
  | "primary"
  | "error-fill"
  | "primary-outline"
  | "error-outline"
  | "success-outline"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "link";

export type ActionButton = Omit<React.ComponentPropsWithoutRef<"button">, "children"> & {
  label: string;
  variant?: ButtonVariant;
  /** Rendered by the underlying `Button` before/after the label. */
  prependIcon?: IconElement;
  appendIcon?: IconElement;
  loading?: boolean;
  [key: `data-${string}`]: string | undefined;
};

/** @deprecated Use EmptyStateCompactProps, EmptyStateDetailedProps, or EmptyStateProps instead. */
export type EmptyStateCommonConfig = {
  title?: string;
  actions?: ActionButton[];
  /** CSS classes for the content wrapper */
  className?: string;
  /** CSS classes for the root container */
  rootClassName?: string;
  /** CSS classes for the asset wrapper */
  assetClassName?: string;
  description?: string;
  assetKey?: CompactAssetType | DetailedAssetType;
  asset?: React.ReactNode;
  align?: Align;
  customButton?: React.ReactNode;
};

/** @deprecated Use EmptyStateCompactProps, EmptyStateDetailedProps, or EmptyStateProps instead. */
export type BaseEmptyStateCommonProps = EmptyStateCommonConfig;
