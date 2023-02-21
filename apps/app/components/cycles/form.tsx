import { useEffect } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, CustomDatePicker, CustomSelect, Input, TextArea } from "components/ui";
// types
import { ICycle } from "types";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: ICycle;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  status: "draft",
  start_date: "",
  end_date: "",
};

export const CycleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<ICycle>({
    defaultValues,
  });

  const handleCreateUpdateCycle = async (formData: Partial<ICycle>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateCycle)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} Cycle
        </h3>
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
          <div>
            <h6 className="text-gray-500">Status</h6>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  {...field}
                  label={<span className="capitalize">{field.value ?? "Select Status"}</span>}
                  input
                >
                  {[
                    { label: "Draft", value: "draft" },
                    { label: "Started", value: "started" },
                    { label: "Completed", value: "completed" },
                  ].map((item) => (
                    <CustomSelect.Option key={item.value} value={item.value}>
                      {item.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
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
              <h6 className="text-gray-500">End Date</h6>
              <div className="w-full">
                <Controller
                  control={control}
                  name="end_date"
                  rules={{ required: "End date is required" }}
                  render={({ field: { value, onChange } }) => (
                    <CustomDatePicker
                      renderAs="input"
                      value={value}
                      onChange={onChange}
                      error={errors.end_date ? true : false}
                    />
                  )}
                />
                {errors.end_date && (
                  <h6 className="text-sm text-red-500">{errors.end_date.message}</h6>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button theme="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {status
            ? isSubmitting
              ? "Updating Cycle..."
              : "Update Cycle"
            : isSubmitting
            ? "Creating Cycle..."
            : "Create Cycle"}
        </Button>
      </div>
    </form>
  );
};
