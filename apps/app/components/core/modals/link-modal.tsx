import React from "react";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
import type { IIssueLink, ModuleLink } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onFormSubmit: (formData: IIssueLink | ModuleLink) => Promise<void>;
};

const defaultValues: ModuleLink = {
  title: "",
  url: "",
};

export const LinkModal: React.FC<Props> = ({ isOpen, handleClose, onFormSubmit }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onSubmit = async (formData: ModuleLink) => {
    await onFormSubmit(formData);

    onClose();
  };

  const onClose = () => {
    handleClose();
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 border border-custom-border-200 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <div className="space-y-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-custom-text-100"
                      >
                        Add Link
                      </Dialog.Title>
                      <div className="mt-2 space-y-3">
                        <div>
                          <Input
                            id="url"
                            label="URL"
                            name="url"
                            type="url"
                            placeholder="Enter URL"
                            autoComplete="off"
                            error={errors.url}
                            register={register}
                            validations={{
                              required: "URL is required",
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            id="title"
                            label="Title"
                            name="title"
                            type="text"
                            placeholder="Enter title"
                            autoComplete="off"
                            error={errors.title}
                            register={register}
                            validations={{
                              required: "Title is required",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Adding Link..." : "Add Link"}
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
