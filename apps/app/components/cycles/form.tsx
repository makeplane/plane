import { useEffect } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";

// ui
import { DateSelect, Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { ICycle } from "types";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: ICycle | null;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
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
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {status ? "Update" : "Create"} Cycle
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              autoComplete="off"
              id="name"
              name="name"
              type="name"
              className="resize-none text-xl"
              placeholder="Title"
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
              placeholder="Description"
              className="h-32 resize-none text-sm"
              error={errors.description}
              register={register}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect label="Start date" value={value} onChange={(val) => onChange(val)} />
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="end_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect label="End date" value={value} onChange={(val) => onChange(val)} />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-custom-border-100 px-5 pt-5">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? "Updating Cycle..."
              : "Update Cycle"
            : isSubmitting
            ? "Creating Cycle..."
            : "Create Cycle"}
        </PrimaryButton>
      </div>
    </form>
  );
};
