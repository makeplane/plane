import { FC, useEffect, Fragment } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, Input } from "@plane/ui";
// types
import type { IIssueLink, ILinkDetails, ModuleLink } from "@plane/types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ILinkDetails | null;
  status: boolean;
  createIssueLink: (formData: IIssueLink | ModuleLink) => Promise<ILinkDetails> | Promise<void> | void;
  updateIssueLink: (formData: IIssueLink | ModuleLink, linkId: string) => Promise<ILinkDetails> | Promise<void> | void;
};

const defaultValues: IIssueLink | ModuleLink = {
  title: "",
  url: "",
};

export const LinkModal: FC<Props> = (props) => {
  const { isOpen, handleClose, createIssueLink, updateIssueLink, status, data } = props;
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<IIssueLink | ModuleLink>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const handleFormSubmit = async (formData: IIssueLink | ModuleLink) => {
    if (!data) await createIssueLink({ title: formData.title, url: formData.url });
    else await updateIssueLink({ title: formData.title, url: formData.url }, data.id);
    onClose();
  };

  const handleCreateUpdatePage = async (formData: IIssueLink | ModuleLink) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
                <form onSubmit={handleSubmit(handleCreateUpdatePage)}>
                  <div>
                    <div className="space-y-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        {status ? "Update Link" : "Add Link"}
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
                      {status
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
