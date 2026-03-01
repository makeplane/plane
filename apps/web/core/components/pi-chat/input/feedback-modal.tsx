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

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalWidth, ModalCore, TextArea } from "@plane/ui";

type TProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackMessage: string) => void;
};

export const FeedbackModal = observer(function FeedbackModal(props: TProps) {
  const { isOpen, onClose, onSubmit } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<{
    message: string;
  }>({
    defaultValues: { message: "" },
  });
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleFormSubmit = async (formData: { message: string }) => {
    await onSubmit(formData.message);
    handleClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.MD}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">Feedback </h3>
          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              <label htmlFor="url" className="mb-2 text-tertiary text-14 font-medium">
                Please provide details: (optional)
              </label>
              <Controller
                control={control}
                name="message"
                rules={{
                  required: false,
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <TextArea
                    id="message"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.message)}
                    placeholder="What was unsatisfying about this response?"
                    className="w-full resize-none min-h-24 text-14"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
          <Button variant="secondary" onClick={handleClose}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} className="capitalize">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
