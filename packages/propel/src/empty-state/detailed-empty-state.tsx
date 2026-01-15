// local imports
import { Button } from "../button/button";
import { cn } from "../utils/classname";
import { getDetailedAsset } from "./assets/asset-registry";
import type { DetailedAssetType } from "./assets/asset-types";
import type { BaseEmptyStateCommonProps } from "./types";

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
}: BaseEmptyStateCommonProps) {
  // Determine which asset to use: assetKey takes precedence, fallback to custom asset
  const resolvedAsset = assetKey ? getDetailedAsset(assetKey as DetailedAssetType, assetClassName) : asset;

  return (
    <div className={cn("flex size-full items-center justify-center", rootClassName)}>
      <div
        className={cn(
          "flex max-w-[25rem] size-full flex-col justify-center gap-6 text-left",
          {
            "items-center text-center": align === "center",
          },
          className
        )}
      >
        {resolvedAsset && <div className="flex max-w-40 items-center">{resolvedAsset}</div>}

        <div
          className={cn("flex flex-col gap-4", {
            "items-center": align === "center",
          })}
        >
          {(title || description) && (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-16 font-semibold leading-7 text-primary">{title}</h3>}
              {description && <p className="text-13 leading-5 text-tertiary">{description}</p>}
            </div>
          )}

          {customButton
            ? customButton
            : actions &&
              actions.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row">
                  {actions.map((action, index) => {
                    const { label, variant, ...rest } = action;
                    return (
                      <Button key={index} variant={variant} size="xl" {...rest}>
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

EmptyStateDetailed.displayName = "EmptyStateDetailed";
