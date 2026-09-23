/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { Suspense } from "react";
import { EmptyStateActionButton } from "./action-button";
import { cn } from "@plane/utils";
import type { Align } from "../utils/placement";
import { getCompactAsset } from "./assets/asset-registry";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";
import type { ActionButton } from "./types";

export type EmptyStateCompactProps = {
  title?: string;
  actions?: ActionButton[];
  className?: string;
  rootClassName?: string;
  assetClassName?: string;
  description?: string;
  assetKey?: CompactAssetType | DetailedAssetType;
  asset?: React.ReactNode;
  align?: Align;
  customButton?: React.ReactNode;
};

export function EmptyStateCompact({
  asset,
  assetKey,
  title,
  description,
  actions,
  className,
  rootClassName,
  assetClassName,
  align = "center",
  customButton,
}: EmptyStateCompactProps) {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getCompactAsset(assetKey as CompactAssetType, assetClassName) : asset;

  const rootAlignClasses = align === "center" ? "items-center" : "items-start";
  const containerAlignClasses = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={cn("flex size-full items-center justify-center", rootAlignClasses, rootClassName)}>
      <div
        className={cn("flex size-full max-w-[25rem] flex-col justify-center gap-3", containerAlignClasses, className)}
      >
        {resolvedAsset && (
          <div className="flex max-w-40 items-center">
            <Suspense fallback={null}>{resolvedAsset}</Suspense>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {title && description ? (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-h6-semibold leading-7 text-primary">{title}</h3>}
              {description && <p className="text-body-xs-regular leading-5 text-tertiary">{description}</p>}
            </div>
          ) : (
            title && <p className="text-body-xs-regular leading-5 text-tertiary">{title}</p>
          )}

          {customButton
            ? customButton
            : actions &&
              actions.length > 0 && (
                <div
                  className={cn("flex flex-col gap-4 sm:flex-row", {
                    "justify-center": align === "center",
                  })}
                >
                  {actions.map((action, index) => (
                    // propel: old `base` (24px) is Propel's `sm`
                    <EmptyStateActionButton key={index} action={action} size="sm" />
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

EmptyStateCompact.displayName = "EmptyStateCompact";
