import React, { useEffect } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { Controller, useForm } from "react-hook-form";
// react color
import { TwitterPicker } from "react-color";
// headless
import { Dialog, Popover, Transition } from "@headlessui/react";
// services
import stateService from "lib/services/state.service";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button, Input, TextArea } from "ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// types
import type { IState } from "types";
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
};

const CreateUpdateStateModal: React.FC<Props> = ({ isOpen, data, projectId, handleClose }) => {
  const onClose = () => {
    handleClose();
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const { activeWorkspace } = useUser();

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

  const onSubmit = async (formData: IState) => {
    if (!activeWorkspace) return;
    const payload: IState = {
      ...formData,
    };
    if (!data) {
      await stateService
        .createState(activeWorkspace.slug, projectId, payload)
        .then((res) => {
          mutate<IState[]>(STATE_LIST(projectId), (prevData) => [...(prevData ?? []), res], false);
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
        .updateState(activeWorkspace.slug, projectId, data.id, payload)
        .then((res) => {
          mutate<IState[]>(
            STATE_LIST(projectId),
            (prevData) => {
              const newData = prevData?.map((item) => {
                if (item.id === res.id) {
                  return res;
                }
                return item;
              });
              return newData;
            },
            false
          );
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

  useEffect(() => {
    if (data) {
      reset(data);
    } else {
      reset(defaultValues);
    }
  }, [data, reset]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                          <Popover className="relative">
                            {({ open }) => (
                              <>
                                <Popover.Button
                                  className={`group bg-white rounded-md inline-flex items-center text-base font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                    open ? "text-gray-900" : "text-gray-500"
                                  }`}
                                >
                                  <span>Color</span>
                                  {watch("color") && watch("color") !== "" && (
                                    <span
                                      className="w-4 h-4 ml-2 rounded"
                                      style={{
                                        backgroundColor: watch("color") ?? "green",
                                      }}
                                    ></span>
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
                                  <Popover.Panel className="fixed z-50 transform left-5 mt-3 px-2 w-screen max-w-xs sm:px-0">
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

export default CreateUpdateStateModal;
