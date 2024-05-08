import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// types
import { IEstimate, IEstimateFormData } from "@plane/types";
// ui
import { Button, Input, TextArea, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
// helpers
import { checkDuplicates } from "@/helpers/array.helper";
// hooks
import { useEstimate } from "@/hooks/store";

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

        setToast({
          type: TOAST_TYPE.ERROR,
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

        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorString ?? "Estimate could not be updated. Please try again.",
        });
      });
  };

  const onSubmit = async (formData: FormValues) => {
    if (!formData.name || formData.name === "") {
      setToast({
        type: TOAST_TYPE.ERROR,
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
      setToast({
        type: TOAST_TYPE.ERROR,
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
      setToast({
        type: TOAST_TYPE.ERROR,
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
      setToast({
        type: TOAST_TYPE.ERROR,
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5 p-5">
          <div className="text-xl font-medium text-custom-text-200">{data ? "Update" : "Create"} Estimate</div>
          <div className="space-y-3">
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
                    className="w-full text-base"
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
                    className="w-full text-base resize-none min-h-24"
                    hasError={Boolean(errors?.description)}
                  />
                )}
              />
            </div>
          </div>
          {/* list of all the points */}
          {/* since they are all the same, we can use a loop to render them */}
          <div className="grid grid-cols-3 gap-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div className="flex items-center" key={i}>
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
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {data ? (isSubmitting ? "Updating" : "Update Estimate") : isSubmitting ? "Creating" : "Create Estimate"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
