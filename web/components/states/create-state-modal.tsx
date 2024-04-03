import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TwitterPicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Dialog, Popover, Transition } from "@headlessui/react";
// icons
import type { IState } from "@plane/types";
// ui
import { Button, CustomSelect, Input, TextArea, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { GROUP_CHOICES } from "@/constants/project";
// hooks
import { useProjectState } from "@/hooks/store";
// types

// types
type Props = {
  isOpen: boolean;
  projectId: string;
  handleClose: () => void;
};

const defaultValues: Partial<IState> = {
  name: "",
  description: "",
  color: "rgb(var(--color-text-200))",
  group: "backlog",
};

export const CreateStateModal: React.FC<Props> = observer((props) => {
  const { isOpen, projectId, handleClose } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { createState } = useProjectState();
  // form info
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

    await createState(workspaceSlug.toString(), projectId.toString(), payload)
      .then(() => {
        onClose();
      })
      .catch((err) => {
        const error = err.response;

        if (typeof error === "object") {
          Object.keys(error).forEach((key) => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: Array.isArray(error[key]) ? error[key].join(", ") : error[key],
            });
          });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message:
              error ?? err.status === 400
                ? "Another state exists with the same name. Please try again with another name."
                : "State could not be created. Please try again.",
          });
        }
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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-4 pb-4 pt-5 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
                              <label htmlFor="name" className="mb-2 text-custom-text-200">
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
                              optionsClassName="w-full"
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
                                className={`group inline-flex items-center rounded-md bg-custom-background-100 text-base font-medium hover:text-custom-text-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
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
                                <ChevronDown
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
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
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
});
