import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// components
import { Button, Input, TextArea, CustomSelect } from "components/ui";
// types
import type { ICycle } from "types";

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  status: "draft",
  start_date: new Date().toString(),
  end_date: new Date().toString(),
};

export interface CycleFormProps {
  handleFormSubmit: (values: Partial<ICycle>) => void;
  handleFormCancel?: () => void;
  initialData?: Partial<ICycle>;
}

export const CycleForm: FC<CycleFormProps> = (props) => {
  const { handleFormSubmit, handleFormCancel = () => {}, initialData = null } = props;
  // form handler
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
  } = useForm<ICycle>({
    defaultValues: initialData || defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5">
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
              <Input
                id="start_date"
                label="Start Date"
                name="start_date"
                type="date"
                placeholder="Enter start date"
                error={errors.start_date}
                register={register}
                validations={{
                  required: "Start date is required",
                }}
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
                validations={{
                  required: "End date is required",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button theme="secondary" onClick={handleFormCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {initialData
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
