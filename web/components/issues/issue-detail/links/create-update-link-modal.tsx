"use client";

import { FC, useEffect, Fragment } from "react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import type { TIssueLinkEditableFields } from "@plane/types";
// ui
import { Button, Input } from "@plane/ui";
// types
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "remove">;

export type TIssueLinkCreateFormFieldOptions = TIssueLinkEditableFields & {
  id?: string;
};

export type TIssueLinkCreateEditModal = {
  isModalOpen: boolean;
  handleModal: (modalToggle: boolean) => void;
  linkOperations: TLinkOperationsModal;
  preloadedData?: TIssueLinkCreateFormFieldOptions | null;
};

const defaultValues: TIssueLinkCreateFormFieldOptions = {
  title: "",
  url: "",
};

export const IssueLinkCreateUpdateModal: FC<TIssueLinkCreateEditModal> = (props) => {
  // props
  const { isModalOpen, handleModal, linkOperations, preloadedData } = props;

  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TIssueLinkCreateFormFieldOptions>({
    defaultValues,
  });

  const onClose = () => {
    handleModal(false);
    const timeout = setTimeout(() => {
      reset(preloadedData ? preloadedData : defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const handleFormSubmit = async (formData: TIssueLinkCreateFormFieldOptions) => {
    if (!formData || !formData.id) await linkOperations.create({ title: formData.title, url: formData.url });
    else await linkOperations.update(formData.id as string, { title: formData.title, url: formData.url });
    onClose();
  };

  useEffect(() => {
    reset({ ...defaultValues, ...preloadedData });
  }, [preloadedData, reset]);

  return (
    <Transition.Root show={isModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
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
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div>
                    <div className="space-y-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        {preloadedData?.id ? "Update Link" : "Add Link"}
                      </Dialog.Title>
                      <div className="mt-2 space-y-3">
                        <div>
                          <label htmlFor="url" className="mb-2 text-custom-text-200">
                            URL
                          </label>
                          <Controller
                            control={control}
                            name="url"
                            rules={{
                              required: "URL is required",
                            }}
                            render={({ field: { value, onChange, ref } }) => (
                              <Input
                                id="url"
                                name="url"
                                type="url"
                                value={value}
                                onChange={onChange}
                                ref={ref}
                                hasError={Boolean(errors.url)}
                                placeholder="https://..."
                                pattern="^(https?://).*"
                                className="w-full"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <label htmlFor="title" className="mb-2 text-custom-text-200">
                            {`Title (optional)`}
                          </label>
                          <Controller
                            control={control}
                            name="title"
                            render={({ field: { value, onChange, ref } }) => (
                              <Input
                                id="title"
                                name="title"
                                type="text"
                                value={value}
                                onChange={onChange}
                                ref={ref}
                                hasError={Boolean(errors.title)}
                                placeholder="Enter title"
                                className="w-full"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                      {preloadedData?.id
                        ? isSubmitting
                          ? "Updating Link..."
                          : "Update Link"
                        : isSubmitting
                          ? "Adding Link..."
                          : "Add Link"}
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
