import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Dialog, Popover, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import type { IIssueLabels, IState } from "types";
// constants
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

// types
type Props = {
  isOpen: boolean;
  projectId: string;
  handleClose: () => void;
};

const defaultValues: Partial<IState> = {
  name: "",
  color: "#000000",
};

export const CreateLabelModal: React.FC<Props> = ({ isOpen, projectId, handleClose }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    control,
    reset,
    setError,
  } = useForm<IIssueLabels>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    reset(defaultValues);
  };

  const onSubmit = async (formData: IIssueLabels) => {
    if (!workspaceSlug) return;

    await issuesService
      .createIssueLabel(workspaceSlug as string, projectId as string, formData)
      .then((res) => {
        mutate<IIssueLabels[]>(
          PROJECT_ISSUE_LABELS(projectId),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        onClose();
      })
      .catch((error) => {
        console.log(error);
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
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-brand-surface-1 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-brand-base">
                      Create Label
                    </Dialog.Title>
                    <div className="mt-8 flex items-center gap-2">
                      <Popover className="relative">
                        {({ open, close }) => (
                          <>
                            <Popover.Button
                              className={`group inline-flex items-center rounded-sm bg-brand-surface-2 text-base font-medium hover:text-brand-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                open ? "text-brand-base" : "text-brand-secondary"
                              }`}
                            >
                              {watch("color") && watch("color") !== "" && (
                                <span
                                  className="ml-2 h-4 w-4 rounded"
                                  style={{
                                    backgroundColor: watch("color") ?? "black",
                                  }}
                                />
                              )}
                              <ChevronDownIcon
                                className={`ml-2 h-5 w-5 group-hover:text-brand-secondary ${
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
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter name"
                        autoComplete="off"
                        error={errors.name}
                        register={register}
                        width="full"
                        validations={{
                          required: "Name is required",
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Creating Label..." : "Create Label"}
                    </PrimaryButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
