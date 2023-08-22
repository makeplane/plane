import React from "react";

import { useRouter } from "next/router";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
import type { IProject } from "types";

// types
type Props = {
  isOpen: boolean;
  type: "auto-close" | "auto-archive";
  initialValues: Partial<IProject>;
  handleClose: () => void;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const SelectMonthModal: React.FC<Props> = ({
  type,
  initialValues,
  isOpen,
  handleClose,
  handleChange,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IProject>({
    defaultValues: initialValues,
  });

  const onClose = () => {
    handleClose();
    reset(initialValues);
  };

  const onSubmit = (formData: Partial<IProject>) => {
    if (!workspaceSlug && !projectId) return;
    handleChange(formData);
    onClose();
  };

  const inputSection = (name: string) => (
    <div className="relative flex flex-col gap-1 justify-center w-full">
      <Input
        type="number"
        id={name}
        name={name}
        placeholder="Enter Months"
        autoComplete="off"
        register={register}
        width="full"
        validations={{
          required: "Select a month between 1 and 12.",
          min: 1,
          max: 12,
        }}
        className="border-custom-border-200"
      />
      <span className="absolute text-sm text-custom-text-200 top-2.5 right-8">Months</span>
    </div>
  );

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
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-90 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-custom-text-100"
                    >
                      Customize Time Range
                    </Dialog.Title>
                    <div className="mt-8 flex items-center gap-2">
                      <div className="flex w-full flex-col gap-1 justify-center">
                        {type === "auto-close" ? (
                          <>
                            {inputSection("close_in")}
                            {errors.close_in && (
                              <span className="text-sm px-1 text-red-500">
                                Select a month between 1 and 12.
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {inputSection("archive_in")}
                            {errors.archive_in && (
                              <span className="text-sm px-1 text-red-500">
                                Select a month between 1 and 12.
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit"}
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
