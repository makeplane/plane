import React from "react";
import { AlertTriangle, Info, LucideIcon } from "lucide-react";
// components
import { Button, TButtonVariant } from "../button";
import { ModalCore } from "./modal-core";
// constants
import { EModalPosition, EModalWidth } from "./constants";
// helpers
import { cn } from "../../helpers";

export type TModalVariant = "danger" | "primary";

type Props = {
  content: React.ReactNode | string;
  handleClose: () => void;
  handleSubmit: () => Promise<void>;
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
};

const VARIANT_ICONS: Record<TModalVariant, LucideIcon> = {
  danger: AlertTriangle,
  primary: Info,
};

const BUTTON_VARIANTS: Record<TModalVariant, TButtonVariant> = {
  danger: "danger",
  primary: "primary",
};

const VARIANT_CLASSES: Record<TModalVariant, string> = {
  danger: "bg-red-500/20 text-red-500",
  primary: "bg-custom-primary-100/20 text-custom-primary-100",
};

export const AlertModalCore: React.FC<Props> = (props) => {
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
  } = props;

  const Icon = VARIANT_ICONS[variant];

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={position} width={width}>
      <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {!hideIcon && (
          <span
            className={cn(
              "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10",
              VARIANT_CLASSES[variant]
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-1 text-sm text-custom-text-200">{content}</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {secondaryButtonText}
        </Button>
        <Button variant={BUTTON_VARIANTS[variant]} size="sm" tabIndex={1} onClick={handleSubmit} loading={isSubmitting}>
          {isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
        </Button>
      </div>
    </ModalCore>
  );
};
