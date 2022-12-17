import React, { useEffect } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, Input, TextArea, Select } from "ui";
// services
import modulesService from "lib/services/modules.service";
// hooks
import useUser from "lib/hooks/useUser";
// types
import type { IModule } from "types";
// common
import { renderDateFormat } from "constants/common";
// fetch keys
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  data?: IModule;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
};

const CreateUpdateModuleModal: React.FC<Props> = ({ isOpen, setIsOpen, data, projectId }) => {
  const handleClose = () => {
    setIsOpen(false);
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
    reset,
    setError,
  } = useForm<IModule>({
    defaultValues,
  });

  const onSubmit = async (formData: IModule) => {
    if (!activeWorkspace) return;
    const payload = {
      ...formData,
      start_date: formData.start_date ? renderDateFormat(formData.start_date) : null,
      target_date: formData.target_date ? renderDateFormat(formData.target_date) : null,
    };
    if (!data) {
      await modulesService
        .createModule(activeWorkspace.slug, projectId, payload)
        .then((res) => {
          mutate<IModule[]>(
            MODULE_LIST(projectId),
            (prevData) => [res, ...(prevData ?? [])],
            false
          );
          handleClose();
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof typeof defaultValues, {
              message: err[key].join(", "),
            });
          });
        });
    } else {
      await modulesService
        .updateModule(activeWorkspace.slug, projectId, data.id, payload)
        .then((res) => {
          mutate<IModule[]>(
            MODULE_LIST(projectId),
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
          handleClose();
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof typeof defaultValues, {
              message: err[key].join(", "),
            });
          });
        });
    }
  };

  useEffect(() => {
    if (data) {
      setIsOpen(true);
      reset(data);
    } else {
      reset(defaultValues);
    }
  }, [data, setIsOpen, reset]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {data ? "Update" : "Create"} Module
                    </Dialog.Title>
                    <div className="space-y-3">
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
                        <TextArea
                          id="description"
                          name="description"
                          label="Description"
                          placeholder="Enter description"
                          error={errors.description}
                          register={register}
                        />
                      </div>
                      <div>
                        <Select
                          id="status"
                          name="status"
                          label="Status"
                          error={errors.status}
                          register={register}
                          validations={{
                            required: "Status is required",
                          }}
                          options={[
                            { label: "Backlog", value: "backlog" },
                            { label: "Planned", value: "planned" },
                            { label: "In Progress", value: "in-progress" },
                            { label: "Paused", value: "paused" },
                            { label: "Completed", value: "completed" },
                            { label: "Cancelled", value: "cancelled" },
                          ]}
                        />
                      </div>
                      <div className="flex gap-x-2">
                        <div className="w-full">
                          <Input
                            id="start_date"
                            label="Start Date"
                            name="start_date"
                            type="date"
                            placeholder="Enter start date"
                            error={errors.start_date}
                            register={register}
                          />
                        </div>
                        <div className="w-full">
                          <Input
                            id="target_date"
                            label="Target Date"
                            name="target_date"
                            type="date"
                            placeholder="Enter target date"
                            error={errors.target_date}
                            register={register}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button theme="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {data
                        ? isSubmitting
                          ? "Updating Module..."
                          : "Update Module"
                        : isSubmitting
                        ? "Creating Module..."
                        : "Create Module"}
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

export default CreateUpdateModuleModal;
