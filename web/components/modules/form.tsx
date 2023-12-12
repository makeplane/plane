import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// components
import { ModuleLeadSelect, ModuleMembersSelect, ModuleStatusSelect } from "components/modules";
// ui
import { DateSelect } from "components/ui";
import { Button, Input, TextArea } from "@plane/ui";
// types
import { IModule } from "types";
import { IssueProjectSelect } from "components/issues/select";

type Props = {
  handleFormSubmit: (values: Partial<IModule>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  data?: IModule;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead: null,
  members: [],
};

export const ModuleForm: React.FC<Props> = ({
  handleFormSubmit,
  handleClose,
  status,
  projectId,
  setActiveProject,
  data,
}) => {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    control,
    reset,
  } = useForm<IModule>({
    defaultValues: {
      project: projectId,
      name: data?.name || "",
      description: data?.description || "",
      status: data?.status || "backlog",
      lead: data?.lead || null,
      members: data?.members || [],
    },
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

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5">
        <div className="flex items-center gap-x-3">
          <Controller
            control={control}
            name="project"
            render={({ field: { value, onChange } }) => (
              <IssueProjectSelect
                value={value}
                onChange={(val: string) => {
                  onChange(val);
                  setActiveProject(val);
                }}
              />
            )}
          />
          <h3 className="text-xl font-medium leading-6 text-custom-text-200">{status ? "Update" : "New"} Module</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Module Title"
                  className="w-full resize-none placeholder:text-sm placeholder:font-medium focus:border-blue-400"
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
                  onChange={onChange}
                  placeholder="Description..."
                  className="h-24 w-full resize-none text-sm"
                  hasError={Boolean(errors?.description)}
                />
              )}
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
                  }}
                  maxDate={maxDate ?? undefined}
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
                  }}
                  minDate={minDate ?? undefined}
                />
              )}
            />
            <ModuleStatusSelect control={control} error={errors.status} />
            <Controller
              control={control}
              name="lead"
              render={({ field: { value, onChange } }) => <ModuleLeadSelect value={value} onChange={onChange} />}
            />
            <Controller
              control={control}
              name="members"
              render={({ field: { value, onChange } }) => <ModuleMembersSelect value={value} onChange={onChange} />}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 pt-5">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
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
