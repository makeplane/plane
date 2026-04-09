/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { LucideIcon } from "lucide-react";
import { InfoIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import { AlertTriangle } from "lucide-react";
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
  handleSubmit: () => void | Promise<void>;
  hideIcon?: boolean;
  isDisabled?: boolean;
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

const VARIANT_ICONS: Record<TModalVariant, LucideIcon | React.FC<ISvgIcons>> = {
  danger: AlertTriangle,
  primary: InfoIcon,
};

const BUTTON_VARIANTS: Record<TModalVariant, TButtonVariant> = {
  danger: "error-fill",
  primary: "primary",
};

const VARIANT_CLASSES: Record<TModalVariant, string> = {
  danger: "bg-danger-subtle text-danger-primary",
  primary: "bg-accent-primary/20 text-accent-primary",
};
// TODO: required variant these use cases
// 1. apps/web/core/components/workflows/detail/sidebar/tabs/flow-type/warning-modal.tsx - FlowTypeChangeWarningModal
export function AlertModalCore(props: Props) {
  const {
    content,
    handleClose,
    handleSubmit,
    hideIcon = false,
    isDisabled = false,
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
      <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {!hideIcon && (
          <span
            className={cn(
              "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10",
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
      <div className="px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" onClick={handleClose}>
          {secondaryButtonText}
        </Button>
        <Button
          variant={BUTTON_VARIANTS[variant]}
          tabIndex={1}
          onClick={() => void handleSubmit()}
          disabled={isDisabled}
          loading={isSubmitting}
        >
          {isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
        </Button>
      </div>
    </ModalCore>
  );
}
