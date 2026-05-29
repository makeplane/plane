import React from "react";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";
import { EmptyStateCompact } from "./compact-empty-state";
import { EmptyStateDetailed } from "./detailed-empty-state";
import type { BaseEmptyStateCommonProps } from "./types";

/**
 * @deprecated Use EmptyStateCompact or EmptyStateDetailed directly with assetKey for better type safety
 *
 * This wrapper component maintains backward compatibility for existing code.
 * For new code, prefer:
 * - EmptyStateCompact with assetKey for simple states
 * - EmptyStateDetailed with assetKey for detailed states
 */

type EmptyStateType = "detailed" | "simple";

export interface EmptyStateProps {
  /** @deprecated Use assetKey instead */
  asset?: React.ReactNode;
  title?: string;
  description?: string;
  actions?: BaseEmptyStateCommonProps["actions"];
  className?: string;
  rootClassName?: string;
  assetClassName?: string;
  type?: EmptyStateType;
  /** Type-safe asset key (use instead of asset) */
  assetKey?: CompactAssetType | DetailedAssetType;
}

export function EmptyState({
  type = "detailed",
  asset,
  assetKey,
  title,
  description,
  actions,
  className,
  rootClassName,
  assetClassName,
}: EmptyStateProps) {
  if (type === "simple") {
    return (
      <EmptyStateCompact
        asset={asset}
        assetKey={assetKey}
        title={title || description} // For simple type, use description as title if no title
        actions={actions}
        className={className}
        rootClassName={rootClassName}
        assetClassName={assetClassName}
      />
    );
  }

  return (
    <EmptyStateDetailed
      asset={asset}
      assetKey={assetKey}
      title={title}
      description={description}
      actions={actions}
      className={className}
      rootClassName={rootClassName}
      assetClassName={assetClassName}
    />
  );
}

EmptyState.displayName = "EmptyState";
