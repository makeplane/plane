import type { TButtonVariant } from "../button/helper";
import type { CompactAssetType, DetailedAssetType } from "./assets/asset-types";

export interface ActionButton extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  variant?: TButtonVariant;
  [key: `data-${string}`]: string | undefined;
}

interface BaseEmptyStateCommonProps {
  title?: string;
  actions?: ActionButton[];
  /** CSS classes for the content wrapper */
  className?: string;
  /** CSS classes for the root container */
  rootClassName?: string;
  /** CSS classes for the asset wrapper */
  assetClassName?: string;
}

// Compact Empty State Props - supports horizontal stack and illustration assets
export type CompactEmptyStateProps = BaseEmptyStateCommonProps &
  (
    | {
        /** Asset key for compact empty state (horizontal-stack or illustration) */
        assetKey: CompactAssetType;
        /** Custom React node asset (use this if you want full control) */
        asset?: never;
      }
    | {
        /** Asset key for compact empty state (horizontal-stack or illustration) */
        assetKey?: never;
        /** Custom React node asset (use this if you want full control) */
        asset?: React.ReactNode;
      }
  );

// Detailed Empty State Props - supports vertical stack and illustration assets
export type DetailedEmptyStateProps = BaseEmptyStateCommonProps & {
  description?: string;
} & (
    | {
        /** Asset key for detailed empty state (vertical-stack or illustration) */
        assetKey: DetailedAssetType;
        /** Custom React node asset (use this if you want full control) */
        asset?: never;
      }
    | {
        /** Asset key for detailed empty state (vertical-stack or illustration) */
        assetKey?: never;
        /** Custom React node asset (use this if you want full control) */
        asset?: React.ReactNode;
      }
  );
