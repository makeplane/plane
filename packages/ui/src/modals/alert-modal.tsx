import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info } from "lucide-react";
import React from "react";
// components
import type { TButtonVariant } from "@plane/propel/button";
import { Button } from "@plane/propel/button";
import { cn } from "../utils";
import { EModalPosition, EModalWidth } from "./constants";
import { ModalCore } from "./modal-core";
// constants
// helpers

export type TModalVariant = "danger" | "primary";

type Props = {
  content: React.ReactNode | string;
  handleClose: () => void;
  handleSubmit: (e?: React.MouseEvent) => void;
  hideIcon?: boolean;
  isSubmitting: boolean;
  isOpen: boolean;
  position?: EModalPosition;
  primaryButtonText?: {
    loading: string;
    default: string;
  };
  secondaryButtonText?: string;
  title: string;
  variant?: TModalVariant;
  width?: EModalWidth;
  customIcon?: React.ReactNode;
};

const VARIANT_ICONS: Record<TModalVariant, LucideIcon> = {
  danger: AlertTriangle,
  primary: Info,
};

const BUTTON_VARIANTS: Record<TModalVariant, TButtonVariant> = {
  danger: "error-fill",
  primary: "primary",
};

const VARIANT_CLASSES: Record<TModalVariant, string> = {
  danger: "bg-danger-subtle text-danger-primary",
  primary: "bg-accent-primary/20 text-accent-primary",
};

export function AlertModalCore(props: Props) {
  const {
    content,
    handleClose,
    handleSubmit,
    hideIcon = false,
    isSubmitting,
    isOpen,
    position = EModalPosition.CENTER,
    primaryButtonText = {
      loading: "Deleting",
      default: "Delete",
    },
    secondaryButtonText = "Cancel",
    title,
    variant = "danger",
    width = EModalWidth.XL,
    customIcon,
  } = props;

  const Icon = VARIANT_ICONS[variant];

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={position} width={width}>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
        {!hideIcon && (
          <span
            className={cn(
              "grid size-12 flex-shrink-0 place-items-center rounded-full sm:size-10",
              VARIANT_CLASSES[variant]
            )}
          >
            {customIcon ? <>{customIcon}</> : <Icon className="size-5" aria-hidden="true" />}
          </span>
        )}
        <div className="text-center sm:text-left">
          <h3 className="text-16 font-medium">{title}</h3>
          <p className="mt-1 text-13 text-secondary">{content}</p>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-subtle px-5 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={(e: any) => { if (e?.preventDefault) e.preventDefault(); if (e?.stopPropagation) e.stopPropagation(); handleClose(); }}>
          {secondaryButtonText}
        </Button>
        <Button type="button" variant={BUTTON_VARIANTS[variant]} tabIndex={1} onClick={(e: any) => { if (e?.preventDefault) e.preventDefault(); if (e?.stopPropagation) e.stopPropagation(); handleSubmit(e); }} loading={isSubmitting}>
          {isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
        </Button>
      </div>
    </ModalCore>
  );
}
