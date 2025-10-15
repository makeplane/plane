import React from "react";
import { Button } from "../button/button";
import { cn } from "../utils/classname";
import { getDetailedAsset } from "./assets/asset-registry";
import type { DetailedEmptyStateProps } from "./types";

export const EmptyStateDetailed: React.FC<DetailedEmptyStateProps> = ({
  asset,
  assetKey,
  title,
  description,
  actions,
  className,
  rootClassName,
  assetClassName,
}) => {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getDetailedAsset(assetKey, assetClassName) : asset;

  return (
    <div className={cn("flex size-full items-center justify-center bg-custom-background-90", rootClassName)}>
      <div className={cn("flex max-w-[25rem] size-full flex-col justify-center gap-6 text-left", className)}>
        {resolvedAsset && <div className="flex max-w-40 items-center">{resolvedAsset}</div>}

        <div className="flex flex-col gap-4">
          {(title || description) && (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-lg font-semibold leading-7 text-custom-text-100">{title}</h3>}
              {description && <p className="text-sm leading-5 text-custom-text-300">{description}</p>}
            </div>
          )}

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

EmptyStateDetailed.displayName = "EmptyStateDetailed";
