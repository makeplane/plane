import type { TButtonVariant } from "../button/helper";
import type { TAlign } from "../utils/placement";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";

export interface ActionButton extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  variant?: TButtonVariant;
  [key: `data-${string}`]: string | undefined;
}

export interface BaseEmptyStateCommonProps {
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
  align?: TAlign;
  customButton?: React.ReactNode;
}
