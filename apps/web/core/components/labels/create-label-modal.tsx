"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { TwitterPicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Dialog, Popover, Transition } from "@headlessui/react";
// plane imports
import { ETabIndices, LABEL_COLOR_OPTIONS, getRandomLabelColor } from "@plane/constants";
// types
import type { IIssueLabel, IState } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks

import { usePlatformOS } from "@/hooks/use-platform-os";

// types
type Props = {
  createLabel: (data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  handleClose: () => void;
  isOpen: boolean;
  onSuccess?: (response: IIssueLabel) => void;
};

const defaultValues: Partial<IState> = {
  name: "",
  color: "rgb(var(--color-text-200))",
};

export const CreateLabelModal: React.FC<Props> = observer((props) => {
  const { createLabel, handleClose, isOpen, onSuccess } = props;
  // store hooks
  const { isMobile } = usePlatformOS();
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    setFocus,
  } = useForm<IIssueLabel>({
    defaultValues,
  });

  const { getIndex } = getTabIndex(ETabIndices.CREATE_LABEL, isMobile);

  /**
   * For setting focus on name input
   */
  useEffect(() => {
    setFocus("name");
  }, [setFocus, isOpen]);

  useEffect(() => {
    if (isOpen) setValue("color", getRandomLabelColor());
  }, [setValue, isOpen]);

  const onClose = () => {
    handleClose();
    reset(defaultValues);
  };

  const onSubmit = async (formData: IIssueLabel) => {
    await createLabel(formData)
      .then((res) => {
        onClose();
        if (onSuccess) onSuccess(res);
      })
      .catch((error) => {
        setToast({
          title: "Error!",
          type: TOAST_TYPE.ERROR,
          message: error?.detail ?? "Something went wrong. Please try again later.",
        });
        reset(formData);
      });
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 px-4 pb-4 pt-5 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(onSubmit)(e);
                  }}
                >
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Create Label
                    </Dialog.Title>
                    <div className="mt-8 flex items-center gap-2">
                      <Popover className="relative">
                        {({ open, close }) => (
                          <>
                            <Popover.Button
                              className={`group inline-flex items-center rounded-sm py-2 text-base font-medium hover:text-custom-text-100 focus:outline-none ${
                                open ? "text-custom-text-100" : "text-custom-text-200"
                              }`}
                            >
                              {watch("color") && watch("color") !== "" && (
                                <span
                                  className="ml-2 h-5 w-5 rounded"
                                  style={{
                                    backgroundColor: watch("color") ?? "black",
                                  }}
                                />
                              )}
                              <ChevronDown
                                className={`ml-2 h-5 w-5 group-hover:text-custom-text-200 ${
                                  open ? "text-gray-600" : "text-gray-400"
                                }`}
                                aria-hidden="true"
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
                              <Popover.Panel className="fixed left-5 z-50 mt-3 w-screen max-w-xs transform px-2 sm:px-0">
                                <Controller
                                  name="color"
                                  control={control}
                                  render={({ field: { value, onChange } }) => (
                                    <TwitterPicker
                                      color={value}
                                      colors={LABEL_COLOR_OPTIONS}
                                      onChange={(value) => {
                                        onChange(value.hex);
                                        close();
                                      }}
                                    />
                                  )}
                                />
                              </Popover.Panel>
                            </Transition>
                          </>
                        )}
                      </Popover>
                      <div className="flex w-full flex-col justify-center gap-0.5">
                        <Controller
                          control={control}
                          name="name"
                          rules={{
                            required: "Label title is required",
                          }}
                          render={({ field: { value, onChange, ref } }) => (
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              value={value}
                              onChange={onChange}
                              ref={ref}
                              tabIndex={getIndex("name")}
                              hasError={Boolean(errors.name)}
                              placeholder="Label title"
                              className="w-full resize-none text-xl"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Creating Label..." : "Create Label"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
