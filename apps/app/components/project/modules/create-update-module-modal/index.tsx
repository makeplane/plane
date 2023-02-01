import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import SelectLead from "components/project/modules/create-update-module-modal/select-lead";
import SelectMembers from "components/project/modules/create-update-module-modal/select-members";
import SelectStatus from "components/project/modules/create-update-module-modal/select-status";
// ui
import { Button, CustomDatePicker, Input, TextArea } from "components/ui";
// services
import modulesService from "services/modules.service";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import type { IModule } from "types";
// fetch-keys
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
  status: null,
  lead: null,
  members_list: [],
};

const CreateUpdateModuleModal: React.FC<Props> = ({ isOpen, setIsOpen, data, projectId }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
    setError,
  } = useForm<IModule>({
    defaultValues,
  });

  const onSubmit = async (formData: IModule) => {
    if (!workspaceSlug) return;
    const payload = {
      ...formData,
      start_date: formData.start_date ? renderDateFormat(formData.start_date) : null,
      target_date: formData.target_date ? renderDateFormat(formData.target_date) : null,
    };
    if (!data) {
      await modulesService
        .createModule(workspaceSlug as string, projectId, payload)
        .then(() => {
          mutate(MODULE_LIST(projectId));
          handleClose();

          setToastAlert({
            title: "Success",
            type: "success",
            message: "Module created successfully",
          });
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
        .updateModule(workspaceSlug as string, projectId, data.id, payload)
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

          setToastAlert({
            title: "Success",
            type: "success",
            message: "Module updated successfully",
          });
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

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
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
                            maxLength: {
                              value: 255,
                              message: "Name should be less than 255 characters",
                            },
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
                      <div className="flex gap-x-2">
                        <div className="w-full">
                          <h6 className="text-gray-500">Start Date</h6>
                          <div className="w-full">
                            <Controller
                              control={control}
                              name="start_date"
                              rules={{ required: "Start date is required" }}
                              render={({ field: { value, onChange } }) => (
                                <CustomDatePicker
                                  renderAs="input"
                                  value={value}
                                  onChange={onChange}
                                  error={errors.start_date ? true : false}
                                />
                              )}
                            />
                            {errors.start_date && (
                              <h6 className="text-sm text-red-500">{errors.start_date.message}</h6>
                            )}
                          </div>
                        </div>
                        <div className="w-full">
                          <h6 className="text-gray-500">Target Date</h6>
                          <div className="w-full">
                            <Controller
                              control={control}
                              name="target_date"
                              rules={{ required: "Target date is required" }}
                              render={({ field: { value, onChange } }) => (
                                <CustomDatePicker
                                  renderAs="input"
                                  value={value}
                                  onChange={onChange}
                                  error={errors.target_date ? true : false}
                                />
                              )}
                            />
                            {errors.target_date && (
                              <h6 className="text-sm text-red-500">{errors.target_date.message}</h6>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SelectStatus control={control} error={errors.status} />
                        <SelectLead control={control} />
                        <SelectMembers control={control} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
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
