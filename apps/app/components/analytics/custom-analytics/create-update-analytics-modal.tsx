import React from "react";

import { useRouter } from "next/router";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import analyticsService from "services/analytics.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IAnalyticsParams, ISaveAnalyticsFormData } from "types";

// types
type Props = {
  isOpen: boolean;
  handleClose: () => void;
  params?: IAnalyticsParams;
};

type FormValues = {
  name: string;
  description: string;
};

const defaultValues: FormValues = {
  name: "",
  description: "",
};

export const CreateUpdateAnalyticsModal: React.FC<Props> = ({ isOpen, handleClose, params }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    reset(defaultValues);
  };

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug) return;

    const payload: ISaveAnalyticsFormData = {
      name: formData.name,
      description: formData.description,
      query_dict: {
        x_axis: "priority",
        y_axis: "issue_count",
        ...params,
        project: params?.project ? [params.project] : [],
      },
    };

    await analyticsService
      .saveAnalytics(workspaceSlug.toString(), payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Analytics saved successfully.",
        });
        onClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Analytics could not be saved. Please try again.",
        })
      );
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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg border border-brand-base bg-brand-base px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-brand-base">
                      Save Analytics
                    </Dialog.Title>
                    <div className="mt-5">
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Title"
                        autoComplete="off"
                        error={errors.name}
                        register={register}
                        width="full"
                        validations={{
                          required: "Title is required",
                        }}
                      />
                      <TextArea
                        id="description"
                        name="description"
                        placeholder="Description"
                        className="mt-3 h-32 resize-none text-sm"
                        error={errors.description}
                        register={register}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Analytics"}
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
