import React from "react";
import { Button } from "../button/button";
import { cn } from "../utils/classname";
import { getCompactAsset } from "./assets/asset-registry";
import type { CompactAssetType } from "./assets/asset-types";
import type { BaseEmptyStateCommonProps } from "./types";

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
}: BaseEmptyStateCommonProps) {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getCompactAsset(assetKey as CompactAssetType, assetClassName) : asset;

  const rootAlignClasses = align === "center" ? "items-center" : "items-start";
  const containerAlignClasses = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={cn("flex size-full items-center justify-center", rootAlignClasses, rootClassName)}>
      <div
        className={cn("flex max-w-[25rem] size-full flex-col justify-center gap-3", containerAlignClasses, className)}
      >
        {resolvedAsset && <div className="flex max-w-40 items-center">{resolvedAsset}</div>}

        <div className="flex flex-col gap-4">
          {title && description ? (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-16 font-semibold leading-7 text-primary">{title}</h3>}
              {description && <p className="text-13 leading-5 text-tertiary">{description}</p>}
            </div>
          ) : (
            title && <p className="text-13 leading-5 text-tertiary">{title}</p>
          )}

          {customButton
            ? customButton
            : actions &&
              actions.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row">
                  {actions.map((action, index) => {
                    const { label, variant, ...rest } = action;
                    return (
                      <Button key={index} variant={variant} size="base" {...rest}>
                        {label}
                      </Button>
                    );
                  })}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

EmptyStateCompact.displayName = "EmptyStateCompact";
