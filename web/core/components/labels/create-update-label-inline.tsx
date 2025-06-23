"use client";

import React, { forwardRef, useEffect } from "react";
import { observer } from "mobx-react";
import { TwitterPicker } from "react-color";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { getRandomLabelColor, LABEL_COLOR_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IIssueLabel } from "@plane/types";
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";

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
  color: "rgb(var(--color-text-200))",
};

export const CreateUpdateLabelInline = observer(
  forwardRef<HTMLDivElement, TCreateUpdateLabelInlineProps>(function CreateUpdateLabelInline(props, ref) {
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

    const handleLabelCreate: SubmitHandler<IIssueLabel> = async (formData) => {
      if (isSubmitting) return;

      await labelOperationsCallbacks
        .createLabel(formData)
        .then(() => {
          handleClose();
          reset(defaultValues);
        })
        .catch((error) => {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: error?.detail ?? error.error ?? t("common.something_went_wrong"),
          });
          reset(formData);
        });
    };

    const handleLabelUpdate: SubmitHandler<IIssueLabel> = async (formData) => {
      if (!labelToUpdate?.id || isSubmitting) return;

      await labelOperationsCallbacks
        .updateLabel(labelToUpdate.id, formData)
        .then(() => {
          reset(defaultValues);
          handleClose();
        })
        .catch((error) => {
          setToast({
            title: "Oops!",
            type: TOAST_TYPE.ERROR,
            message: error?.error ?? t("project_settings.labels.toast.error"),
          });
          reset(formData);
        });
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
          className={`flex w-full scroll-m-8 items-center gap-2 bg-custom-background-100 ${labelForm ? "" : "hidden"}`}
        >
          <div className="flex-shrink-0">
            <Popover className="relative z-10 flex h-full w-full items-center justify-center">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`group inline-flex items-center text-base font-medium focus:outline-none ${
                      open ? "text-custom-text-100" : "text-custom-text-200"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundColor: watch("color"),
                      }}
                    />
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
                required: t("project_settings.labels.label_title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("project_settings.labels.label_max_char"),
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
                  placeholder={t("project_settings.labels.label_title")}
                  className="w-full"
                />
              )}
            />
          </div>
          <Button variant="neutral-primary" onClick={() => handleClose()} size="sm">
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(handleFormSubmit)();
            }}
            size="sm"
            loading={isSubmitting}
          >
            {isUpdating ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
          </Button>
        </div>
        {errors.name?.message && <p className="p-0.5 pl-8 text-sm text-red-500">{errors.name?.message}</p>}
      </>
    );
  })
);
