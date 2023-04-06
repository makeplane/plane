import React, { useEffect, useRef, useState } from "react";

import { useRouter } from "next/router";

import { useForm } from "react-hook-form";

import { mutate } from "swr";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";

// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// types
import type { IEstimate, IEstimatePoint } from "types";

import estimatesService from "services/estimates.service";

type Props = {
  isOpen: boolean;
  data?: IEstimatePoint[];
  estimate: IEstimate | null;
  onClose: () => void;
};

interface FormValues {
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  value5: string;
  value6: string;
  value7: string;
  value8: string;
}

const defaultValues: FormValues = {
  value1: "",
  value2: "",
  value3: "",
  value4: "",
  value5: "",
  value6: "",
  value7: "",
  value8: "",
};

export const EstimatePointsModal: React.FC<Props> = ({ isOpen, data, estimate, onClose }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<FormValues>({ defaultValues });

  const handleClose = () => {
    onClose();
    reset();
  };

  const createEstimatePoints = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      estimate_points: [
        {
          key: 0,
          value: formData.value1,
        },
        {
          key: 1,
          value: formData.value2,
        },
        {
          key: 2,
          value: formData.value3,
        },
        {
          key: 3,
          value: formData.value4,
        },
        {
          key: 4,
          value: formData.value5,
        },
        {
          key: 5,
          value: formData.value6,
        },
        {
          key: 6,
          value: formData.value7,
        },
        {
          key: 7,
          value: formData.value8,
        },
      ],
    };

    await estimatesService
      .createEstimatePoints(
        workspaceSlug as string,
        projectId as string,
        estimate?.id as string,
        payload
      )
      .then(() => {
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Estimate points could not be created. Please try again.",
        });
      });
  };

  const updateEstimatePoints = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId) return;
    const payload = {
      estimate_points: [
        {
          key: 0,
          value: formData.value1,
        },
        {
          key: 1,
          value: formData.value2,
        },
        {
          key: 2,
          value: formData.value3,
        },
        {
          key: 3,
          value: formData.value4,
        },
        {
          key: 4,
          value: formData.value5,
        },
        {
          key: 5,
          value: formData.value6,
        },
        {
          key: 6,
          value: formData.value7,
        },
        {
          key: 7,
          value: formData.value8,
        },
      ],
    };
    await estimatesService
      .updateEstimatesPoints(
        workspaceSlug as string,
        projectId as string,
        estimate?.id as string,
        data?.[0]?.id as string,
        payload
      )
      .then(() => {
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Estimate points could not be created. Please try again.",
        });
      });
  };

  useEffect(() => {
    if (!data) return;

    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);


  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => handleClose()}>
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
                  onSubmit={
                    data ? handleSubmit(updateEstimatePoints) : handleSubmit(createEstimatePoints)
                  }
                >
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3">
                      <h4 className="text-2xl font-medium">Create Estimate Points</h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V0</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value1"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "value should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V1</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value2"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V2</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value3"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V3</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value4"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V4</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value5"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V5</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value6"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V6</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value7"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 10,
                                    message: "Name should be less than 10 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 h-full flex items-center rounded-lg">
                            <span className="pl-2 pr-1 rounded-lg text-sm  text-gray-600">V7</span>
                            <span className="bg-white rounded-lg">
                              <Input
                                id="name"
                                name="value8"
                                type="name"
                                placeholder="Value"
                                autoComplete="off"
                                register={register}
                                validations={{
                                  required: "value is required",
                                  maxLength: {
                                    value: 20,
                                    message: "Name should be less than 20 characters",
                                  },
                                }}
                              />
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={() => handleClose()}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {data
                        ? isSubmitting
                          ? "Updating Points..."
                          : "Update Points"
                        : isSubmitting
                        ? "Creating Points..."
                        : "Create Points"}
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
