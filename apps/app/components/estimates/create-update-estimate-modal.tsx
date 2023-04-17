import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import estimatesService from "services/estimates.service";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
import { Dialog, Transition } from "@headlessui/react";

// hooks
import useToast from "hooks/use-toast";

// types
import { IEstimate } from "types";
// fetch-keys
import { ESTIMATES_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

const defaultValues: Partial<IEstimate> = {
  name: "",
  description: "",
};

export const CreateUpdateEstimateModal: React.FC<Props> = ({ handleClose, data, isOpen }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IEstimate>({
    defaultValues,
  });

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const createEstimate = async (formData: IEstimate) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      name: formData.name,
      description: formData.description,
    };

    await estimatesService
      .createEstimate(workspaceSlug as string, projectId as string, payload)
      .then((res) => {
        mutate<IEstimate[]>(
          ESTIMATES_LIST(projectId as string),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error: Estimate could not be created",
        });
      });
  };

  const updateEstimate = async (formData: IEstimate) => {
    if (!workspaceSlug || !projectId || !data) return;

    const payload = {
      name: formData.name,
      description: formData.description,
    };

    mutate<IEstimate[]>(
      ESTIMATES_LIST(projectId as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === data.id) return { ...p, ...payload };

          return p;
        }),
      false
    );

    await estimatesService
      .patchEstimate(workspaceSlug as string, projectId as string, data?.id as string, payload)
      .then(() => {
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error: Estimate could not be updated",
        });
      });
    handleClose();
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto">
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
                <Dialog.Panel className="relative transform rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <form
                    onSubmit={data ? handleSubmit(updateEstimate) : handleSubmit(createEstimate)}
                  >
                    <div className="space-y-3">
                      <div className="text-lg font-medium leading-6">
                        {data ? "Update" : "Create"} Estimate
                      </div>
                      <div>
                        <Input
                          id="name"
                          name="name"
                          type="name"
                          placeholder="Title"
                          autoComplete="off"
                          mode="transparent"
                          className="resize-none text-xl"
                          error={errors.name}
                          register={register}
                          validations={{
                            required: "Title is required",
                            maxLength: {
                              value: 255,
                              message: "Title should be less than 255 characters",
                            },
                          }}
                        />
                      </div>
                      <div>
                        <TextArea
                          id="description"
                          name="description"
                          placeholder="Description"
                          className="h-32 resize-none text-sm"
                          mode="transparent"
                          error={errors.description}
                          register={register}
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                      <PrimaryButton type="submit" loading={isSubmitting}>
                        {data
                          ? isSubmitting
                            ? "Updating Estimate..."
                            : "Update Estimate"
                          : isSubmitting
                          ? "Creating Estimate..."
                          : "Create Estimate"}
                      </PrimaryButton>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
