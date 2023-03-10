import { useEffect } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// components
import { ModuleLeadSelect, ModuleMembersSelect, ModuleStatusSelect } from "components/modules";
// ui
import { Button, CustomDatePicker, Input, TextArea } from "components/ui";
// types
import { IModule } from "types";

type Props = {
  handleFormSubmit: (values: Partial<IModule>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IModule;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: null,
  lead: null,
  members_list: [],
};

export const ModuleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<IModule>({
    defaultValues,
  });

  const handleCreateUpdateModule = async (formData: Partial<IModule>) => {
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
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} Module
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
          <div className="flex gap-x-2">
            <div className="w-full">
              <h6 className="text-gray-500">Start Date</h6>
              <div className="w-full">
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field: { value, onChange } }) => (
                    <CustomDatePicker renderAs="input" value={value} onChange={onChange} />
                  )}
                />
              </div>
            </div>
            <div className="w-full">
              <h6 className="text-gray-500">Target Date</h6>
              <div className="w-full">
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value, onChange } }) => (
                    <CustomDatePicker renderAs="input" value={value} onChange={onChange} />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModuleStatusSelect control={control} error={errors.status} />
            <Controller
              control={control}
              name="lead"
              render={({ field: { value, onChange } }) => (
                <ModuleLeadSelect value={value} onChange={onChange} />
              )}
            />
            <Controller
              control={control}
              name="members"
              render={({ field: { value, onChange } }) => (
                <ModuleMembersSelect value={value} onChange={onChange} />
              )}
            />
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
              ? "Updating Module..."
              : "Update Module"
            : isSubmitting
            ? "Creating Module..."
            : "Create Module"}
        </Button>
      </div>
    </form>
  );
};
