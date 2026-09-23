/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";
// plane imports
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogIntro,
  AlertDialogTitle,
} from "@makeplane/propel/components/alert-dialog";
import type { AlertDialogIconVariant } from "@makeplane/propel/components/alert-dialog";
import type { ButtonVariant } from "@makeplane/propel/components/button";
import { Button } from "@makeplane/propel/components/button";
import { AlertDialogIcon as AlertDialogIconSlot } from "@makeplane/propel/elements/alert-dialog";
import { useTranslation } from "@plane/i18n";

/**
 * The intents the confirmation dialog ships with. `danger` is destructive, `primary` is
 * informational, and `warning` flags a risky-but-not-destructive confirmation.
 */
export type TConfirmDialogVariant = "danger" | "primary" | "warning";

type ConfirmDialogBaseProps = {
  /** Supporting copy under the title. Rendered inside the dialog's `<p>` description. */
  content: React.ReactNode | string;
  /** Called whenever the dialog asks to close — the cancel button or `Esc`. */
  handleClose: () => void;
  /** Called when the confirm button is pressed. */
  handleSubmit: () => void | Promise<void>;
  /** Drop the leading intent badge entirely. */
  hideIcon?: boolean;
  /** Hard-disable the confirm button (a failed precondition, not an in-flight submit). */
  isDisabled?: boolean;
  /** Whether the dialog is open. Controlled. */
  isOpen: boolean;
  /** Cancel button copy. */
  secondaryButtonText?: string;
  /** The dialog heading. Carries the accessible name. */
  title: string;
  /**
   * Intent. `danger` pairs the danger badge with a danger confirm button; `primary` pairs the info
   * badge with the primary confirm button; `warning` pairs the warning badge with the primary
   * confirm button.
   *
   * @default "danger"
   */
  variant?: TConfirmDialogVariant;
  /** Replaces the variant's own glyph inside the intent badge. The badge tint still follows `variant`. */
  customIcon?: React.ReactNode;
};

/**
 * `isSubmitting`/`primaryButtonText` travel together: a dialog whose confirm never enters an
 * in-flight state (a literal `isSubmitting={false}`) may omit the `loading` label, while any
 * dialog passing a real state flag must provide it. When `loading` is omitted the button keeps
 * its idle label and relies on the spinner alone.
 */
export type ConfirmDialogProps = ConfirmDialogBaseProps &
  (
    | {
        /** This confirm never enters an in-flight state. */
        isSubmitting: false;
        /** Confirm button copy. `loading` is unused here and may be omitted. */
        primaryButtonText?: { loading?: string; default: string };
      }
    | {
        /** Whether the confirm action is in flight. Swaps the label and shows the button spinner. */
        isSubmitting: boolean;
        /** Confirm button copy for the idle and in-flight states. */
        primaryButtonText?: { loading: string; default: string };
      }
  );

const ICON_VARIANTS: Record<TConfirmDialogVariant, AlertDialogIconVariant> = {
  danger: "danger",
  primary: "info",
  warning: "warning",
};

const BUTTON_VARIANTS: Record<TConfirmDialogVariant, ButtonVariant> = {
  danger: "danger",
  primary: "primary",
  warning: "primary",
};

/**
 * The confirmation dialog every destructive action in Plane funnels through — a titled alert with a
 * single confirm and a cancel.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    content,
    handleClose,
    handleSubmit,
    hideIcon = false,
    isDisabled = false,
    isSubmitting,
    isOpen,
    primaryButtonText,
    secondaryButtonText,
    title,
    variant = "danger",
    customIcon,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const confirmLabels = primaryButtonText ?? { loading: t("deleting"), default: t("delete") };
  const cancelLabel = secondaryButtonText ?? t("cancel");
  const iconVariant = ICON_VARIANTS[variant];

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) return;
        if (isSubmitting) return;
        handleClose();
      }}
    >
      <AlertDialogContent data-prevent-outside-click>
        <AlertDialogBody>
          <AlertDialogHeader>
            {!hideIcon &&
              (customIcon ? (
                <AlertDialogIconSlot variant={iconVariant}>{customIcon}</AlertDialogIconSlot>
              ) : (
                <AlertDialogIcon variant={iconVariant} />
              ))}
            <AlertDialogIntro>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{content}</AlertDialogDescription>
            </AlertDialogIntro>
          </AlertDialogHeader>
        </AlertDialogBody>
        <AlertDialogActions>
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label={cancelLabel}
            disabled={isSubmitting}
            render={<AlertDialogClose />}
          />
          <Button
            variant={BUTTON_VARIANTS[variant]}
            size="sm"
            stretch="auto"
            tabIndex={0}
            onClick={() => void handleSubmit()}
            disabled={isDisabled}
            loading={isSubmitting}
            label={isSubmitting ? (confirmLabels.loading ?? confirmLabels.default) : confirmLabels.default}
          />
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

ConfirmDialog.displayName = "blocks.ConfirmDialog";
