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

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";

type TypedConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  title: string;
  description: React.ReactNode;
  confirmationText: string;
  inputLabel: React.ReactNode;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  secondaryButtonText?: string;
};

export function TypedConfirmationModal(props: TypedConfirmationModalProps) {
  const {
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false,
    title,
    description,
    confirmationText,
    inputLabel,
    primaryButtonText = { default: "Confirm", loading: "Confirming" },
    secondaryButtonText = "Cancel",
  } = props;
  // state
  const [inputValue, setInputValue] = useState("");
  // derived
  const canConfirm = inputValue.trim().toLowerCase() === confirmationText.toLowerCase();

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!canConfirm || isSubmitting) return;
    await onSubmit();
    setInputValue("");
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-4">
          <span className="grid shrink-0 place-items-center rounded-full bg-danger-subtle size-10">
            <AlertTriangle className="size-5 text-danger-primary" aria-hidden="true" />
          </span>
          <h3 className="text-16 font-medium">{title}</h3>
        </div>
        <p className="text-13 text-secondary">{description}</p>
        <div className="text-secondary">
          <p className="text-13">{inputLabel}</p>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmationText}
            className="mt-2 w-full"
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle pt-4">
          <Button variant="secondary" onClick={handleClose}>
            {secondaryButtonText}
          </Button>
          <Button variant="error-fill" onClick={handleSubmit} disabled={!canConfirm} loading={isSubmitting}>
            {isSubmitting ? primaryButtonText.loading : primaryButtonText.default}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
