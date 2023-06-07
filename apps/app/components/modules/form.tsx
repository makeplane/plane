import { useEffect, useState } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// components
import { ModuleLeadSelect, ModuleMembersSelect, ModuleStatusSelect } from "components/modules";
// ui
import { DateSelect, Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// helper
import { isDateRangeValid } from "helpers/date-time.helper";
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
  status: "backlog",
  lead: null,
  members_list: [],
};

export const ModuleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const [isDateValid, setIsDateValid] = useState(true);
  const { setToastAlert } = useToast();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
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
        <h3 className="text-lg font-medium leading-6 text-brand-base">
          {status ? "Update" : "Create"} Module
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              name="name"
              type="name"
              placeholder="Title"
              autoComplete="off"
              className="resize-none text-xl"
              error={errors.name}
              register={register}
              validations={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
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
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value, onChange } }) => (
                <DateSelect
                  label="Start date"
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    if (val && watch("target_date")) {
                      if (isDateRangeValid(val, `${watch("target_date")}`)) {
                        setIsDateValid(true);
                      } else {
                        setIsDateValid(false);
                        setToastAlert({
                          type: "error",
                          title: "Error!",
                          message:
                            "The date you have entered is invalid. Please check and enter a valid date.",
                        });
                      }
                    }
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="target_date"
              render={({ field: { value, onChange } }) => (
                <DateSelect
                  label="Target date"
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    if (watch("start_date") && val) {
                      if (isDateRangeValid(`${watch("start_date")}`, val)) {
                        setIsDateValid(true);
                      } else {
                        setIsDateValid(false);
                        setToastAlert({
                          type: "error",
                          title: "Error!",
                          message:
                            "The date you have entered is invalid. Please check and enter a valid date.",
                        });
                      }
                    }
                  }}
                />
              )}
            />
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
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-brand-base px-5 pt-5">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting || isDateValid ? false : true}>
          {status
            ? isSubmitting
              ? "Updating Module..."
              : "Update Module"
            : isSubmitting
            ? "Creating Module..."
            : "Create Module"}
        </PrimaryButton>
      </div>
    </form>
  );
};
