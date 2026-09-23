/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Suspense } from "react";
// local imports
import { EmptyStateActionButton } from "./action-button";
import { cn } from "@plane/utils";
import type { Align } from "../utils/placement";
import { getDetailedAsset } from "./assets/asset-registry";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";
import type { ActionButton } from "./types";

export type EmptyStateDetailedProps = {
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

export function EmptyStateDetailed({
  asset,
  assetKey,
  title,
  description,
  actions,
  className,
  rootClassName,
  assetClassName,
  customButton,
  align = "start",
}: EmptyStateDetailedProps) {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getDetailedAsset(assetKey as DetailedAssetType, assetClassName) : asset;

  return (
    <div className={cn("flex size-full items-center justify-center", rootClassName)}>
      <div
        className={cn(
          "flex size-full max-w-[25rem] flex-col justify-center gap-6 text-left",
          {
            "items-center text-center": align === "center",
          },
          className
        )}
      >
        {resolvedAsset && (
          <div className="flex max-w-40 items-center">
            <Suspense fallback={null}>{resolvedAsset}</Suspense>
          </div>
        )}

        <div
          className={cn("flex flex-col gap-4", {
            "items-center": align === "center",
          })}
        >
          {(title || description) && (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-h6-semibold leading-7 text-primary">{title}</h3>}
              {description && <p className="text-body-xs-regular leading-5 text-tertiary">{description}</p>}
            </div>
          )}

          {customButton
            ? customButton
            : actions &&
              actions.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row">
                  {actions.map((action, index) => (
                    // propel: old `xl` (32px) is Propel's `lg`
                    <EmptyStateActionButton key={index} action={action} size="lg" />
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

EmptyStateDetailed.displayName = "EmptyStateDetailed";
