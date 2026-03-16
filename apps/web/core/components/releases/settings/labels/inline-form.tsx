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

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { TwitterPicker } from "react-color";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ReleaseLabel, ReleaseLabelWrite } from "@plane/types";
import { Input } from "@plane/ui";

export type ReleaseLabelOperationsCallbacks = {
  createLabel: (data: ReleaseLabelWrite) => Promise<ReleaseLabel | undefined>;
  updateLabel: (labelId: string, data: Partial<ReleaseLabelWrite>) => Promise<ReleaseLabel | undefined>;
};

type Props = {
  isUpdating: boolean;
  labelOperationsCallbacks: ReleaseLabelOperationsCallbacks;
  labelToUpdate?: ReleaseLabel;
  onClose?: () => void;
};

const defaultValues: ReleaseLabelWrite = {
  name: "",
  color: "var(--text-color-secondary)",
};

export const CreateUpdateReleaseLabelInline = observer(function CreateUpdateReleaseLabelInline(props: Props) {
  const { isUpdating, labelOperationsCallbacks, labelToUpdate, onClose } = props;
  const { t } = useTranslation();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setFocus,
  } = useForm<ReleaseLabelWrite>({ defaultValues });

  const handleClose = () => {
    reset(defaultValues);
    onClose?.();
  };

  const handleCreate: SubmitHandler<ReleaseLabelWrite> = async (formData) => {
    if (isSubmitting) return;
    try {
      await labelOperationsCallbacks.createLabel(formData);
      handleClose();
      reset(defaultValues);
    } catch {
      reset(formData);
    }
  };

  const handleUpdate: SubmitHandler<ReleaseLabelWrite> = async (formData) => {
    if (!labelToUpdate?.id || isSubmitting) return;
    try {
      await labelOperationsCallbacks.updateLabel(labelToUpdate.id, formData);
      reset(defaultValues);
      handleClose();
    } catch {
      reset(formData);
    }
  };

  const handleFormSubmit = (formData: ReleaseLabelWrite) => {
    if (isUpdating) {
      void handleUpdate(formData);
    } else {
      void handleCreate(formData);
    }
  };

  useEffect(() => {
    if (labelToUpdate) {
      setValue("name", labelToUpdate.name);
      setValue("color", labelToUpdate.color || "#000");
    } else {
      setValue("name", "");
      setValue("color", getRandomLabelColor());
    }
    setFocus("name");
  }, [labelToUpdate, setValue, setFocus]);

  return (
    <>
      <div className="flex w-full scroll-m-8 items-center gap-2 bg-surface-1 px-3 py-2 rounded-lg">
        <div className="flex-shrink-0">
          <Popover className="relative z-10 flex h-full w-full items-center justify-center">
            {({ open }) => (
              <>
                <Popover.Button
                  aria-label={t("releases.settings.labels.pick_color")}
                  className={`group inline-flex items-center text-14 font-medium focus:outline-none ${
                    open ? "text-primary" : "text-secondary"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: watch("color") }} />
                </Popover.Button>
                <Transition
                  as={React.Fragment}
                  show={open}
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
              required: t("releases.settings.labels.errors.name_required"),
              maxLength: { value: 255, message: t("project_settings.labels.label_max_char") },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="releaseLabelName"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.name)}
                placeholder={t("releases.settings.labels.modal.name_placeholder")}
                className="w-full h-8"
              />
            )}
          />
        </div>

        <Button variant="secondary" onClick={handleClose} size={"xl"}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(handleFormSubmit)();
          }}
          loading={isSubmitting}
          size={"xl"}
        >
          {isUpdating ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
        </Button>
      </div>
      {errors.name?.message && <p className="p-0.5 pl-8 text-13 text-danger-primary">{errors.name.message}</p>}
    </>
  );
});
