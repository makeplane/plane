import React from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
import { TwitterPicker } from "react-color";
import { Dialog, Popover, Transition } from "@headlessui/react";
// services
import { ProjectStateService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect } from "components/ui";
import { Button, Input, TextArea } from "@plane/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import type { IUser, IState, IStateResponse } from "types";
// fetch keys
import { STATES_LIST } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES } from "constants/project";
// types
type Props = {
  isOpen: boolean;
  projectId: string;
  handleClose: () => void;
  user: IUser | undefined;
};

const defaultValues: Partial<IState> = {
  name: "",
  description: "",
  color: "rgb(var(--color-text-200))",
  group: "backlog",
};

const projectStateService = new ProjectStateService();

export const CreateStateModal: React.FC<Props> = ({ isOpen, projectId, handleClose, user }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    control,
    reset,
  } = useForm<IState>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    reset(defaultValues);
  };

  const onSubmit = async (formData: IState) => {
    if (!workspaceSlug) return;

    const payload: IState = {
      ...formData,
    };

    await projectStateService
      .createState(workspaceSlug as string, projectId, payload, user)
      .then((res) => {
        mutate<IStateResponse>(
          STATES_LIST(projectId.toString()),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              [res.group]: [...prevData[res.group], res],
            };
          },
          false
        );
        onClose();
      })
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Another state exists with the same name. Please try again with another name.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "State could not be created. Please try again.",
          });
      });
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
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-80 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Create State
                    </Dialog.Title>
                    <div className="mt-2 space-y-3">
                      <div>
                        <Controller
                          control={control}
                          name="name"
                          rules={{
                            required: "Name is required",
                          }}
                          render={({ field: { value, onChange, ref } }) => (
                            <>
                              <label htmlFor="name" className="text-custom-text-200 mb-2">
                                Name
                              </label>
                              <Input
                                id="name"
                                name="name"
                                type="text"
                                value={value}
                                onChange={onChange}
                                ref={ref}
                                hasError={Boolean(errors.name)}
                                placeholder="Enter name"
                                className="w-full"
                              />
                            </>
                          )}
                        />
                      </div>
                      <div>
                        <Controller
                          control={control}
                          rules={{ required: true }}
                          name="group"
                          render={({ field: { value, onChange } }) => (
                            <CustomSelect
                              value={value}
                              label={GROUP_CHOICES[value as keyof typeof GROUP_CHOICES]}
                              onChange={onChange}
                              width="w-full"
                              input
                            >
                              {Object.keys(GROUP_CHOICES).map((key) => (
                                <CustomSelect.Option key={key} value={key}>
                                  {GROUP_CHOICES[key as keyof typeof GROUP_CHOICES]}
                                </CustomSelect.Option>
                              ))}
                            </CustomSelect>
                          )}
                        />
                      </div>
                      <div>
                        <Popover className="relative">
                          {({ open }) => (
                            <>
                              <Popover.Button
                                className={`group inline-flex items-center rounded-md bg-custom-background-80 text-base font-medium hover:text-custom-text-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                  open ? "text-custom-text-100" : "text-custom-text-200"
                                }`}
                              >
                                <span>Color</span>
                                {watch("color") && watch("color") !== "" && (
                                  <span
                                    className="ml-2 h-4 w-4 rounded"
                                    style={{
                                      backgroundColor: watch("color") ?? "black",
                                    }}
                                  />
                                )}
                                <ChevronDownIcon
                                  className={`ml-2 h-5 w-5 group-hover:text-custom-text-200 ${
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
                                      <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
                                    )}
                                  />
                                </Popover.Panel>
                              </Transition>
                            </>
                          )}
                        </Popover>
                      </div>
                      <div>
                        <label htmlFor="description" className="mb-2 text-custom-text-200">
                          Description
                        </label>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TextArea
                              id="description"
                              name="description"
                              value={value}
                              placeholder="Enter description"
                              onChange={onChange}
                              hasError={Boolean(errors?.description)}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="neutral-primary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Creating State..." : "Create State"}
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
