import React, { useEffect } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless
import { Dialog, Transition } from "@headlessui/react";
// services
import cycleService from "lib/services/cycles.service";
// fetch keys
import { CYCLE_LIST } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// common
import { renderDateFormat } from "constants/common";
// ui
import { Button, Input, TextArea, Select } from "ui";

// types
import type { ICycle } from "types";
type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  data?: ICycle;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
};

const CreateUpdateCycleModal: React.FC<Props> = ({ isOpen, setIsOpen, data, projectId }) => {
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
  } = useForm<ICycle>({
    defaultValues,
  });

  const onSubmit = async (formData: ICycle) => {
    if (!activeWorkspace) return;
    const payload = {
      ...formData,
      start_date: formData.start_date ? renderDateFormat(formData.start_date) : null,
      end_date: formData.end_date ? renderDateFormat(formData.end_date) : null,
    };
    if (!data) {
      await cycleService
        .createCycle(activeWorkspace.slug, projectId, payload)
        .then((res) => {
          mutate<ICycle[]>(CYCLE_LIST(projectId), (prevData) => [res, ...(prevData ?? [])], false);
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
      await cycleService
        .updateCycle(activeWorkspace.slug, projectId, data.id, payload)
        .then((res) => {
          mutate<ICycle[]>(
            CYCLE_LIST(projectId),
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
                      {data ? "Update" : "Create"} Cycle
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
                            { label: "Draft", value: "draft" },
                            { label: "Started", value: "started" },
                            { label: "Completed", value: "completed" },
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
                            id="end_date"
                            label="End Date"
                            name="end_date"
                            type="date"
                            placeholder="Enter end date"
                            error={errors.end_date}
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
                          ? "Updating Cycle..."
                          : "Update Cycle"
                        : isSubmitting
                        ? "Creating Cycle..."
                        : "Create Cycle"}
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

export default CreateUpdateCycleModal;
