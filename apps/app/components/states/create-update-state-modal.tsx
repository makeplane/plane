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
import stateService from "services/state.service";
// ui
import { Button, Input, Select, TextArea } from "components/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import type { IState } from "types";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES } from "constants/project";

// types
type Props = {
  isOpen: boolean;
  projectId: string;
  data?: IState;
  handleClose: () => void;
};

const defaultValues: Partial<IState> = {
  name: "",
  description: "",
  color: "#000000",
  group: "backlog",
};

export const CreateUpdateStateModal: React.FC<Props> = ({
  isOpen,
  data,
  projectId,
  handleClose,
}) => {
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
  } = useForm<IState>({
    defaultValues,
  });

  useEffect(() => {
    if (data) {
      reset(data);
    } else {
      reset(defaultValues);
    }
  }, [data, reset]);

  const onClose = () => {
    handleClose();
    reset(defaultValues);
  };

  const onSubmit = async (formData: IState) => {
    if (!workspaceSlug) return;
    const payload: IState = {
      ...formData,
    };
    if (!data) {
      await stateService
        .createState(workspaceSlug as string, projectId, payload)
        .then((res) => {
          mutate(STATE_LIST(projectId));
          onClose();
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof IState, {
              message: err[key].join(", "),
            });
          });
        });
    } else {
      await stateService
        .updateState(workspaceSlug as string, projectId, data.id, payload)
        .then((res) => {
          mutate(STATE_LIST(projectId));
          onClose();
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof IState, {
              message: err[key].join(", "),
            });
          });
        });
    }
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {data ? "Update" : "Create"} State
                      </Dialog.Title>
                      <div className="mt-2 space-y-3">
                        <div>
                          <Input
                            id="name"
                            label="Name"
                            name="name"
                            type="name"
                            placeholder="Enter name"
                            autoComplete="off"
                            error={errors.name}
                            register={register}
                            validations={{
                              required: "Name is required",
                            }}
                          />
                        </div>
                        <div>
                          <Select
                            id="group"
                            label="Group"
                            name="group"
                            error={errors.group}
                            register={register}
                            validations={{
                              required: "Group is required",
                            }}
                            options={Object.keys(GROUP_CHOICES).map((key) => ({
                              value: key,
                              label: GROUP_CHOICES[key as keyof typeof GROUP_CHOICES],
                            }))}
                          />
                        </div>
                        <div>
                          <Popover className="relative">
                            {({ open }) => (
                              <>
                                <Popover.Button
                                  className={`group inline-flex items-center rounded-md bg-white text-base font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    open ? "text-gray-900" : "text-gray-500"
                                  }`}
                                >
                                  <span>Color</span>
                                  {watch("color") && watch("color") !== "" && (
                                    <span
                                      className="ml-2 h-4 w-4 rounded"
                                      style={{
                                        backgroundColor: watch("color") ?? "green",
                                      }}
                                    />
                                  )}
                                  <ChevronDownIcon
                                    className={`ml-2 h-5 w-5 group-hover:text-gray-500 ${
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
                                          onChange={(value) => onChange(value.hex)}
                                        />
                                      )}
                                    />
                                  </Popover.Panel>
                                </Transition>
                              </>
                            )}
                          </Popover>
                        </div>
                        <div>
                          <TextArea
                            id="description"
                            name="description"
                            label="Description"
                            placeholder="Enter description"
                            error={errors.description}
                            register={register}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button theme="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {data
                        ? isSubmitting
                          ? "Updating State..."
                          : "Update State"
                        : isSubmitting
                        ? "Creating State..."
                        : "Create State"}
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
