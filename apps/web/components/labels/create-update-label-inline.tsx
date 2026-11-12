/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { forwardRef, useEffect } from "react";
import { observer } from "mobx-react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { LabelsFilled } from "@makeplane/propel/icons";
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { ColorSwatchPicker } from "@plane/blocks/common";
import { setToast } from "@plane/blocks/toast";
import type { IIssueLabel } from "@plane/types";

// error codes
const errorCodes = {
  LABEL_NAME_ALREADY_EXISTS: "LABEL_NAME_ALREADY_EXISTS",
};

export type TLabelOperationsCallbacks = {
  createLabel: (data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  updateLabel: (labelId: string, data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
};

type TCreateUpdateLabelInlineProps = {
  labelForm: boolean;
  setLabelForm: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  labelOperationsCallbacks: TLabelOperationsCallbacks;
  labelToUpdate?: IIssueLabel;
  onClose?: () => void;
};

const defaultValues: Partial<IIssueLabel> = {
  name: "",
  color: "var(--text-color-secondary)",
};

export const CreateUpdateLabelInline = observer(
  forwardRef(function CreateUpdateLabelInline(
    props: TCreateUpdateLabelInlineProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) {
    const { labelForm, setLabelForm, isUpdating, labelOperationsCallbacks, labelToUpdate, onClose } = props;
    // form info
    const {
      handleSubmit,
      control,
      reset,
      formState: { errors, isSubmitting },
      watch,
      setValue,
      setFocus,
    } = useForm<IIssueLabel>({
      defaultValues,
    });

    const { t } = useTranslation();

    const handleClose = () => {
      setLabelForm(false);
      reset(defaultValues);
      if (onClose) onClose();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getErrorMessage = (error: any, operation: "create" | "update"): string => {
      const errorData = error ?? {};

      const labelError = errorData.name?.includes(errorCodes.LABEL_NAME_ALREADY_EXISTS);
      if (labelError) {
        return t("label.create.already_exists");
      }

      // Fallback to general error messages
      if (operation === "create") {
        return errorData?.detail ?? errorData?.error ?? t("common.something_went_wrong");
      }

      return errorData?.error ?? t("project_settings.labels.toast.error");
    };

    const handleLabelCreate: SubmitHandler<IIssueLabel> = async (formData) => {
      if (isSubmitting) return;

      try {
        await labelOperationsCallbacks.createLabel(formData);
        handleClose();
        reset(defaultValues);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "create");
        setToast({
          title: "Error!",
          type: "error",
          message: errorMessage,
        });
        reset(formData);
      }
    };

    const handleLabelUpdate: SubmitHandler<IIssueLabel> = async (formData) => {
      if (!labelToUpdate?.id || isSubmitting) return;

      try {
        await labelOperationsCallbacks.updateLabel(labelToUpdate.id, formData);
        reset(defaultValues);
        handleClose();
      } catch (error) {
        const errorMessage = getErrorMessage(error, "update");
        setToast({
          title: "Oops!",
          type: "error",
          message: errorMessage,
        });
        reset(formData);
      }
    };

    const handleFormSubmit = (formData: IIssueLabel) => {
      if (isUpdating) {
        handleLabelUpdate(formData);
      } else {
        handleLabelCreate(formData);
      }
    };

    /**
     * For settings focus on name input
     */
    useEffect(() => {
      setFocus("name");
    }, [setFocus, labelForm]);

    useEffect(() => {
      if (!labelToUpdate) return;

      setValue("name", labelToUpdate.name);
      setValue("color", labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000");
    }, [labelToUpdate, setValue]);

    useEffect(() => {
      if (labelToUpdate) {
        setValue("color", labelToUpdate.color && labelToUpdate.color !== "" ? labelToUpdate.color : "#000");
        return;
      }

      setValue("color", getRandomLabelColor());
    }, [labelToUpdate, setValue]);

    return (
      <>
        <div
          ref={ref}
          className={`flex w-full scroll-m-8 items-center gap-2 bg-transparent ${labelForm ? "" : "hidden"}`}
        >
          <div className="shrink-0">
            <Controller
              name="color"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Popover>
                  <PopoverTrigger
                    render={
                      <IconButton
                        variant="secondary"
                        size="lg"
                        aria-label={t("aria_labels.color_picker.open")}
                        icon={<LabelsFilled width={16} height={16} color={watch("color")} />}
                      />
                    }
                  />
                  <PopoverContent variant="rich" side="bottom" align="start">
                    <div className="w-80 max-w-xs">
                      <ColorSwatchPicker colors={LABEL_COLOR_OPTIONS} value={value} onChange={onChange} />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <Controller
              control={control}
              name="name"
              rules={{
                required: t("project_settings.labels.label_title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("project_settings.labels.label_max_char"),
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <InputField
                  size="lg"
                  orientation="vertical"
                  id="labelName"
                  name="name"
                  type="text"
                  autoFocus
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  aria-label={t("project_settings.labels.label_title")}
                  placeholder={t("project_settings.labels.label_title")}
                  error={errors.name?.message}
                />
              )}
            />
          </div>
          <Button variant="ghost" size="lg" stretch="auto" onClick={() => handleClose()} label={t("cancel")} />
          <Button
            variant="secondary"
            size="lg"
            stretch="auto"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(handleFormSubmit)();
            }}
            loading={isSubmitting}
            label={isUpdating ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
          />
        </div>
      </>
    );
  })
);
