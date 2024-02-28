import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// components
import { ModuleStatusSelect } from "components/modules";
import { DateRangeDropdown, ProjectDropdown, MemberDropdown } from "components/dropdowns";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { IModule } from "@plane/types";

type Props = {
  handleFormSubmit: (values: Partial<IModule>, dirtyFields: any) => Promise<void>;
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
  lead_id: null,
  member_ids: [],
};

export const ModuleForm: React.FC<Props> = (props) => {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data } = props;
  // form info
  const {
    formState: { errors, isSubmitting, dirtyFields },
    handleSubmit,
    control,
    reset,
  } = useForm<IModule>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      status: data?.status || "backlog",
      lead_id: data?.lead_id || null,
      member_ids: data?.member_ids || [],
    },
  });

  const handleCreateUpdateModule = async (formData: Partial<IModule>) => {
    await handleFormSubmit(formData, dirtyFields);

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
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project_id"
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
              render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                    <DateRangeDropdown
                      buttonVariant="border-with-text"
                      className="h-7"
                      minDate={new Date()}
                      value={{
                        from: startDateValue ? new Date(startDateValue) : undefined,
                        to: endDateValue ? new Date(endDateValue) : undefined,
                      }}
                      onSelect={(val) => {
                        onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                        onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                      }}
                      placeholder={{
                        from: "Start date",
                        to: "End date",
                      }}
                      hideIcon={{
                        to: true,
                      }}
                      tabIndex={3}
                    />
                  )}
                />
              )}
            />
            <div className="h-7">
              <ModuleStatusSelect control={control} error={errors.status} tabIndex={4} />
            </div>
            <Controller
              control={control}
              name="lead_id"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple={false}
                    buttonVariant="border-with-text"
                    placeholder="Lead"
                    tabIndex={5}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="member_ids"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple
                    buttonVariant={value && value.length > 0 ? "transparent-without-text" : "border-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    placeholder="Members"
                    tabIndex={6}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 pt-5">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={7}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={8}>
          {status ? (isSubmitting ? "Updating" : "Update module") : isSubmitting ? "Creating" : "Create module"}
        </Button>
      </div>
    </form>
  );
};
