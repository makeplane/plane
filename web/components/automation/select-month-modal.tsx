import React from "react";
import { useRouter } from "next/router";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, Input } from "@plane/ui";
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

export const SelectMonthModal: React.FC<Props> = ({ type, initialValues, isOpen, handleClose, handleChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
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
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Customise Time Range
                    </Dialog.Title>
                    <div className="mt-8 flex items-center gap-2">
                      <div className="flex w-full flex-col gap-1 justify-center">
                        {type === "auto-close" ? (
                          <>
                            <Controller
                              control={control}
                              name="close_in"
                              rules={{
                                required: "Select a month between 1 and 12.",
                                min: 1,
                                max: 12,
                              }}
                              render={({ field: { value, onChange, ref } }) => (
                                <div className="relative flex flex-col gap-1 justify-center w-full">
                                  <Input
                                    id="close_in"
                                    name="close_in"
                                    type="number"
                                    value={value.toString()}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.close_in)}
                                    placeholder="Enter Months"
                                    className="border-custom-border-200 w-full"
                                  />
                                  <span className="absolute text-sm text-custom-text-200 top-2.5 right-8">Months</span>
                                </div>
                              )}
                            />

                            {errors.close_in && (
                              <span className="text-sm px-1 text-red-500">Select a month between 1 and 12.</span>
                            )}
                          </>
                        ) : (
                          <>
                            <Controller
                              control={control}
                              name="archive_in"
                              rules={{
                                required: "Select a month between 1 and 12.",
                                min: 1,
                                max: 12,
                              }}
                              render={({ field: { value, onChange, ref } }) => (
                                <div className="relative flex flex-col gap-1 justify-center w-full">
                                  <Input
                                    id="archive_in"
                                    name="archive_in"
                                    type="number"
                                    value={value.toString()}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.archive_in)}
                                    placeholder="Enter Months"
                                    className="border-custom-border-200 w-full"
                                  />
                                  <span className="absolute text-sm text-custom-text-200 top-2.5 right-8">Months</span>
                                </div>
                              )}
                            />
                            {errors.archive_in && (
                              <span className="text-sm px-1 text-red-500">Select a month between 1 and 12.</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="neutral-primary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit"}
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
};
