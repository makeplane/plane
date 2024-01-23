import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// components
import { ModuleStatusSelect } from "components/modules";
import { DateDropdown, ProjectDropdown, ProjectMemberDropdown } from "components/dropdowns";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { IModule } from "@plane/types";

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

  const minDate = startDate ? new Date(startDate) : new Date();
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5">
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ProjectDropdown
                    value={value}
                    onChange={(val) => {
                      onChange(val);
                      setActiveProject(val);
                    }}
                    buttonVariant="border-with-text"
                    tabIndex={10}
                  />
                </div>
              )}
            />
          )}
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
                  tabIndex={1}
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
                  tabIndex={2}
                />
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <DateDropdown
                    value={value}
                    onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                    buttonVariant="border-with-text"
                    placeholder="Start date"
                    minDate={new Date()}
                    maxDate={maxDate ?? undefined}
                    tabIndex={3}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="target_date"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <DateDropdown
                    value={value}
                    onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                    buttonVariant="border-with-text"
                    placeholder="Target date"
                    minDate={minDate ?? undefined}
                    tabIndex={4}
                  />
                </div>
              )}
            />
            <ModuleStatusSelect control={control} error={errors.status} tabIndex={5} />
            <Controller
              control={control}
              name="lead"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ProjectMemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple={false}
                    buttonVariant="border-with-text"
                    placeholder="Lead"
                    tabIndex={6}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="members"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ProjectMemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple
                    buttonVariant={value && value.length > 0 ? "transparent-without-text" : "border-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    placeholder="Members"
                    tabIndex={7}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 pt-5">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={8}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={9}>
          {status ? (isSubmitting ? "Updating" : "Update module") : isSubmitting ? "Creating" : "Create module"}
        </Button>
      </div>
    </form>
  );
};
