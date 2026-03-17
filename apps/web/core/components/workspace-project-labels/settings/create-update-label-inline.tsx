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

import React, { forwardRef, useEffect } from "react";
import { observer } from "mobx-react";
import { TwitterPicker } from "react-color";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBaseLabel } from "@plane/types";
import { Input } from "@plane/ui";
import { LabelFilledIcon } from "@plane/propel/icons";

// error codes
const errorCodes = {
  LABEL_NAME_ALREADY_EXISTS: "PROJECT_LABEL_NAME_ALREADY_EXISTS",
};

export type TWorkspaceLabelOperationsCallbacks = {
  createLabel: (data: Partial<IBaseLabel>) => Promise<IBaseLabel>;
  updateLabel: (labelId: string, data: Partial<IBaseLabel>) => Promise<IBaseLabel>;
};

type TCreateUpdateWorkspaceLabelInlineProps = {
  labelForm: boolean;
  setLabelForm: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  labelOperationsCallbacks: TWorkspaceLabelOperationsCallbacks;
  labelToUpdate?: IBaseLabel;
  onClose?: () => void;
};

const defaultValues: Partial<IBaseLabel> = {
  name: "",
  color: "var(--text-color-secondary)",
};

export const CreateUpdateWorkspaceLabelInline = observer(
  forwardRef(function CreateUpdateWorkspaceLabelInline(
    props: TCreateUpdateWorkspaceLabelInlineProps,
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
    } = useForm<IBaseLabel>({
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

      const labelError =
        errorData.name?.includes(errorCodes.LABEL_NAME_ALREADY_EXISTS) ||
        errorData.detail === errorCodes.LABEL_NAME_ALREADY_EXISTS;
      if (labelError) {
        return "Label with this name already exists";
      }

      // Fallback to general error messages
      if (operation === "create") {
        return errorData?.detail ?? errorData?.error ?? t("common.something_went_wrong");
      }

      return errorData?.error ?? "Failed to update label";
    };

    const handleLabelCreate: SubmitHandler<IBaseLabel> = async (formData) => {
      if (isSubmitting) return;

      await labelOperationsCallbacks
        .createLabel(formData)
        .then(() => {
          handleClose();
          reset(defaultValues);
        })
        .catch((error) => {
          const errorMessage = getErrorMessage(error, "create");
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: errorMessage,
          });
          reset(formData);
        });
    };

    const handleLabelUpdate: SubmitHandler<IBaseLabel> = async (formData) => {
      if (!labelToUpdate?.id || isSubmitting) return;

      await labelOperationsCallbacks
        .updateLabel(labelToUpdate.id, formData)
        .then(() => {
          reset(defaultValues);
          handleClose();
        })
        .catch((error) => {
          const errorMessage = getErrorMessage(error, "update");
          setToast({
            title: "Oops!",
            type: TOAST_TYPE.ERROR,
            message: errorMessage,
          });
          reset(formData);
        });
    };

    const handleFormSubmit = (formData: IBaseLabel) => {
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
          className={`flex w-full scroll-m-8 items-center gap-2 bg-surface-1 ${labelForm ? "" : "hidden"}`}
        >
          <div className="flex-shrink-0">
            <Popover className="relative z-10 flex h-full w-full items-center justify-center">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`group inline-flex items-center text-14 font-medium focus:outline-none ${
                      open ? "text-primary" : "text-secondary"
                    }`}
                  >
                    <LabelFilledIcon className="h-4 w-4" color={watch("color")} />
                  </Popover.Button>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute left-0 top-full z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
                      <Controller
                        name="color"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TwitterPicker
                            colors={LABEL_COLOR_OPTIONS}
                            color={value}
                            onChange={(value) => onChange(value.hex)}
                          />
                        )}
                      />
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Label title is required",
                maxLength: {
                  value: 255,
                  message: "Label title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="labelName"
                  name="name"
                  type="text"
                  autoFocus
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Label title"
                  className="w-full h-7"
                />
              )}
            />
          </div>
          <Button variant="secondary" onClick={() => handleClose()}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(handleFormSubmit)();
            }}
            loading={isSubmitting}
          >
            {isUpdating ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
          </Button>
        </div>
        {errors.name?.message && <p className="p-0.5 pl-8 text-13 text-danger-primary">{errors.name?.message}</p>}
      </>
    );
  })
);
