/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type * as React from "react";
// plane imports
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogCloseGroup,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogIntro,
  AlertDialogTitle,
} from "@makeplane/propel/components/alert-dialog";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { CloseOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";

/** One value the user has to type before the destructive action unlocks. */
export type TTypeToConfirmField = {
  /** `id`/`name` of the input; unique within the dialog. */
  name: string;
  /** Visible label naming what has to be typed. */
  label: string;
  /** The exact text (surrounding whitespace ignored) that unlocks confirm. */
  expectedValue: string;
  /** Placeholder; defaults to the expected value so the user can see what to type. */
  placeholder?: string;
};

export type TypeToConfirmDialogProps = {
  /** Whether the dialog is open. Controlled. */
  isOpen: boolean;
  /** Called when the dialog asks to close: Cancel, the corner close, or `Esc`. Never while submitting. */
  onClose: () => void;
  /**
   * Runs on confirm (button or Enter in an input). The dialog tracks the in-flight state but never closes
   * itself, so the caller decides whether a failure keeps it open.
   */
  onConfirm: () => Promise<void> | void;
  /** The dialog heading. Carries the accessible name. */
  title: string;
  /** Supporting copy under the title. */
  description: React.ReactNode;
  /** Inputs that must all match before confirm enables, shown in order. At least one. */
  fields: [TTypeToConfirmField, ...TTypeToConfirmField[]];
  /** Confirm button copy. */
  confirmLabel: string;
  /** Confirm button copy while `onConfirm` is in flight. */
  loadingLabel: string;
};

/**
 * A destructive alert that stays locked until the user types the resource's name (and any extra
 * phrase) exactly: danger badge, corner close, labelled inputs, and a danger confirm.
 */
export function TypeToConfirmDialog(props: TypeToConfirmDialogProps) {
  const { isOpen, onClose, onConfirm, title, description, fields, confirmLabel, loadingLabel } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // derived values
  const canConfirm = fields.every(
    (field) => field.expectedValue.length > 0 && (values[field.name] ?? "").trim() === field.expectedValue
  );

  const handleConfirm = async () => {
    if (!canConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open || isSubmitting) return;
        onClose();
      }}
      // Clear once the close animation has finished, so the typed text doesn't vanish while the
      // dialog fades out and the next open starts empty.
      onOpenChangeComplete={(open) => {
        if (!open) setValues({});
      }}
    >
      <AlertDialogContent data-prevent-outside-click>
        <AlertDialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            icon={<Icon icon={CloseOutline} />}
            disabled={isSubmitting}
            render={<AlertDialogClose />}
          />
        </AlertDialogCloseGroup>
        {/* A form with a submit button so Enter in any input confirms, even with several inputs. */}
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void handleConfirm();
          }}
        >
          <AlertDialogBody>
            <AlertDialogHeader>
              <AlertDialogIcon variant="danger" />
              <AlertDialogIntro>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogIntro>
            </AlertDialogHeader>
            <div className="flex flex-col gap-4">
              {fields.map((field) => (
                <InputField
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  type="text"
                  size="lg"
                  orientation="vertical"
                  required
                  label={field.label}
                  placeholder={field.placeholder ?? field.expectedValue}
                  value={values[field.name] ?? ""}
                  onChange={(e) => {
                    const { value } = e.target;
                    setValues((prev) => ({ ...prev, [field.name]: value }));
                  }}
                  autoComplete="off"
                />
              ))}
            </div>
          </AlertDialogBody>
          <AlertDialogActions>
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("cancel")}
              disabled={isSubmitting}
              render={<AlertDialogClose />}
            />
            <Button
              variant="danger"
              size="md"
              stretch="auto"
              type="submit"
              disabled={!canConfirm}
              loading={isSubmitting}
              label={isSubmitting ? loadingLabel : confirmLabel}
            />
          </AlertDialogActions>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

TypeToConfirmDialog.displayName = "blocks.TypeToConfirmDialog";
