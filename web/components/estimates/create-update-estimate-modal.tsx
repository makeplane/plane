import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { ProjectEstimateService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { checkDuplicates } from "helpers/array.helper";
// types
import { IUser, IEstimate, IEstimateFormData } from "types";
// fetch-keys
import { ESTIMATES_LIST, ESTIMATE_DETAILS } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
  user: IUser | undefined;
};

type FormValues = {
  name: string;
  description: string;
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  value5: string;
  value6: string;
};

const defaultValues: Partial<FormValues> = {
  name: "",
  description: "",
  value1: "",
  value2: "",
  value3: "",
  value4: "",
  value5: "",
  value6: "",
};

// services
const projectEstimateService = new ProjectEstimateService();

export const CreateUpdateEstimateModal: React.FC<Props> = ({ handleClose, data, isOpen, user }) => {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<FormValues>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    reset();
  };

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const createEstimate = async (payload: IEstimateFormData) => {
    if (!workspaceSlug || !projectId) return;

    await projectEstimateService
      .createEstimate(workspaceSlug as string, projectId as string, payload, user)
      .then(() => {
        mutate(ESTIMATES_LIST(projectId as string));
        onClose();
      })
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Estimate with that name already exists. Please try again with another name.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Estimate could not be created. Please try again.",
          });
      });
  };

  const updateEstimate = async (payload: IEstimateFormData) => {
    if (!workspaceSlug || !projectId || !data) return;

    mutate<IEstimate[]>(
      ESTIMATES_LIST(projectId.toString()),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === data.id)
            return {
              ...p,
              name: payload.estimate.name,
              description: payload.estimate.description,
              points: p.points.map((point, index) => ({
                ...point,
                value: payload.estimate_points[index].value,
              })),
            };

          return p;
        }),
      false
    );

    await projectEstimateService
      .patchEstimate(workspaceSlug as string, projectId as string, data?.id as string, payload, user)
      .then(() => {
        mutate(ESTIMATES_LIST(projectId.toString()));
        mutate(ESTIMATE_DETAILS(data.id));
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Estimate could not be updated. Please try again.",
        });
      });

    onClose();
  };

  const onSubmit = async (formData: FormValues) => {
    if (!formData.name || formData.name === "") {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate title cannot be empty.",
      });
      return;
    }

    if (
      formData.value1 === "" ||
      formData.value2 === "" ||
      formData.value3 === "" ||
      formData.value4 === "" ||
      formData.value5 === "" ||
      formData.value6 === ""
    ) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate point cannot be empty.",
      });
      return;
    }

    if (
      checkDuplicates([
        formData.value1,
        formData.value2,
        formData.value3,
        formData.value4,
        formData.value5,
        formData.value6,
      ])
    ) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate points cannot have duplicate values.",
      });
      return;
    }

    const payload: IEstimateFormData = {
      estimate: {
        name: formData.name,
        description: formData.description,
      },
      estimate_points: [],
    };

    for (let i = 0; i < 6; i++) {
      const point = {
        key: i,
        value: formData[`value${i + 1}` as keyof FormValues],
      };

      if (data)
        payload.estimate_points.push({
          id: data.points[i].id,
          ...point,
        });
      else payload.estimate_points.push({ ...point });
    }

    if (data) await updateEstimate(payload);
    else await createEstimate(payload);
  };

  useEffect(() => {
    if (data)
      reset({
        ...defaultValues,
        ...data,
        value1: data.points[0]?.value,
        value2: data.points[1]?.value,
        value3: data.points[2]?.value,
        value4: data.points[3]?.value,
        value5: data.points[4]?.value,
        value6: data.points[5]?.value,
      });
    else reset({ ...defaultValues });
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
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
                <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3">
                      <div className="text-lg font-medium leading-6">{data ? "Update" : "Create"} Estimate</div>
                      <div>
                        <Controller
                          control={control}
                          name="name"
                          render={({ field: { value, onChange, ref } }) => (
                            <Input
                              id="name"
                              name="name"
                              type="name"
                              value={value}
                              onChange={onChange}
                              ref={ref}
                              hasError={Boolean(errors.name)}
                              placeholder="Title"
                              className="resize-none text-xl w-full"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TextArea
                              id="description"
                              name="description"
                              value={value}
                              placeholder="Description"
                              onChange={onChange}
                              className="mt-3 h-32 resize-none text-sm"
                              hasError={Boolean(errors?.description)}
                            />
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">1</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value1"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value1"
                                    name="value1"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value1)}
                                    placeholder="Point 1"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">2</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value2"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value2"
                                    name="value2"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value2)}
                                    placeholder="Point 2"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">3</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value3"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value3"
                                    name="value3"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value3)}
                                    placeholder="Point 3"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">4</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value4"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value4"
                                    name="value4"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value4)}
                                    placeholder="Point 4"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">5</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value5"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value5"
                                    name="value5"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value5)}
                                    placeholder="Point 5"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                            <span className="rounded-lg px-2 text-sm text-custom-text-200">6</span>
                            <span className="rounded-r-lg bg-custom-background-100">
                              <Controller
                                control={control}
                                name="value6"
                                render={({ field: { value, onChange, ref } }) => (
                                  <Input
                                    id="value6"
                                    name="value6"
                                    type="text"
                                    value={value}
                                    onChange={onChange}
                                    ref={ref}
                                    hasError={Boolean(errors.value6)}
                                    placeholder="Point 6"
                                    className="rounded-l-none w-full"
                                  />
                                )}
                              />
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button variant="neutral-primary" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={isSubmitting}>
                        {data
                          ? isSubmitting
                            ? "Updating Estimate..."
                            : "Update Estimate"
                          : isSubmitting
                          ? "Creating Estimate..."
                          : "Create Estimate"}
                      </Button>
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
