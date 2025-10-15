import React from "react";
import { Button } from "../button/button";
import { cn } from "../utils/classname";
import { getCompactAsset } from "./assets/asset-registry";
import type { CompactEmptyStateProps } from "./types";

export const EmptyStateCompact: React.FC<CompactEmptyStateProps> = ({
  asset,
  assetKey,
  title,
  actions,
  className,
  rootClassName,
  assetClassName,
}) => {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getCompactAsset(assetKey, assetClassName) : asset;

  return (
    <div className={cn("flex size-full items-center justify-center bg-custom-background-90", rootClassName)}>
      <div
        className={cn("flex max-w-[25rem] size-full flex-col items-center justify-center gap-3 text-center", className)}
      >
        {resolvedAsset && <div className="flex max-w-40 items-center">{resolvedAsset}</div>}

        <div className="flex flex-col gap-4">
          {title && <p className="text-sm leading-5 text-custom-text-300">{title}</p>}

          {actions && actions.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row">
              {actions.map((action, index) => {
                const { label, variant, ...rest } = action;
                return (
                  <Button key={index} variant={variant} {...rest}>
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
};

EmptyStateCompact.displayName = "EmptyStateCompact";
