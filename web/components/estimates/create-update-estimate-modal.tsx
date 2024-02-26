import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// store hooks
import { useEstimate } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { checkDuplicates } from "helpers/array.helper";
// types
import { IEstimate, IEstimateFormData } from "@plane/types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

const defaultValues = {
  name: "",
  description: "",
  value1: "",
  value2: "",
  value3: "",
  value4: "",
  value5: "",
  value6: "",
};

type FormValues = typeof defaultValues;

export const CreateUpdateEstimateModal: React.FC<Props> = observer((props) => {
  const { handleClose, data, isOpen } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { createEstimate, updateEstimate } = useEstimate();
  // form info
  // toast alert
  const { setToastAlert } = useToast();
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

  const handleCreateEstimate = async (payload: IEstimateFormData) => {
    if (!workspaceSlug || !projectId) return;

    await createEstimate(workspaceSlug.toString(), projectId.toString(), payload)
      .then(() => {
        onClose();
      })
      .catch((err) => {
        const error = err?.error;
        const errorString = Array.isArray(error) ? error[0] : error;

        setToastAlert({
          type: "error",
          title: "Error!",
          message:
            errorString ?? err.status === 400
              ? "Estimate with that name already exists. Please try again with another name."
              : "Estimate could not be created. Please try again.",
        });
      });
  };

  const handleUpdateEstimate = async (payload: IEstimateFormData) => {
    if (!workspaceSlug || !projectId || !data) return;

    await updateEstimate(workspaceSlug.toString(), projectId.toString(), data.id, payload)
      .then(() => {
        onClose();
      })
      .catch((err) => {
        const error = err?.error;
        const errorString = Array.isArray(error) ? error[0] : error;

        setToastAlert({
          type: "error",
          title: "Error!",
          message: errorString ?? "Estimate could not be updated. Please try again.",
        });
      });
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
      formData.value1.length > 20 ||
      formData.value2.length > 20 ||
      formData.value3.length > 20 ||
      formData.value4.length > 20 ||
      formData.value5.length > 20 ||
      formData.value6.length > 20
    ) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate point cannot have more than 20 characters.",
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

    if (data) await handleUpdateEstimate(payload);
    else await handleCreateEstimate(payload);
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
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
                <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
                              className="w-full resize-none text-xl"
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

                      {/* list of all the points */}
                      {/* since they are all the same, we can use a loop to render them */}
                      <div className="grid grid-cols-3 gap-3">
                        {Array(6)
                          .fill(0)
                          .map((_, i) => (
                            <div className="flex items-center">
                              <span className="flex h-full items-center rounded-lg bg-custom-background-80">
                                <span className="rounded-lg px-2 text-sm text-custom-text-200">{i + 1}</span>
                                <span className="rounded-r-lg bg-custom-background-100">
                                  <Controller
                                    control={control}
                                    name={`value${i + 1}` as keyof FormValues}
                                    rules={{
                                      maxLength: {
                                        value: 20,
                                        message: "Estimate point must at most be of 20 characters",
                                      },
                                    }}
                                    render={({ field: { value, onChange, ref } }) => (
                                      <Input
                                        ref={ref}
                                        type="text"
                                        value={value}
                                        onChange={onChange}
                                        id={`value${i + 1}`}
                                        name={`value${i + 1}`}
                                        placeholder={`Point ${i + 1}`}
                                        className="w-full rounded-l-none"
                                        hasError={Boolean(errors[`value${i + 1}` as keyof FormValues])}
                                      />
                                    )}
                                  />
                                </span>
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
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
});
