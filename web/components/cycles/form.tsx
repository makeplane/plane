import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// components
import { DateRangeDropdown, ProjectDropdown } from "components/dropdowns";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { ICycle } from "@plane/types";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>, dirtyFields: any) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: (projectId: string) => void;
  data?: ICycle | null;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export const CycleForm: React.FC<Props> = (props) => {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data } = props;
  // form data
  const {
    formState: { errors, isSubmitting, dirtyFields },
    handleSubmit,
    control,
    reset,
  } = useForm<ICycle>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      start_date: data?.start_date || null,
      end_date: data?.end_date || null,
    },
  });

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit((formData) => handleFormSubmit(formData, dirtyFields))}>
      <div className="space-y-5">
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project_id"
              render={({ field: { value, onChange } }) => (
                <ProjectDropdown
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    setActiveProject(val);
                  }}
                  buttonVariant="background-with-text"
                  tabIndex={7}
                />
              )}
            />
          )}
          <h3 className="text-xl font-medium leading-6 text-custom-text-200">{status ? "Update" : "New"} Cycle</h3>
        </div>
        <div className="space-y-3">
          <div className="mt-2 space-y-3">
            <div>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Name is required",
                  maxLength: {
                    value: 255,
                    message: "Name should be less than 255 characters",
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="cycle_name"
                    name="name"
                    type="text"
                    placeholder="Cycle Title"
                    className="w-full resize-none placeholder:text-sm placeholder:font-medium focus:border-blue-400"
                    value={value}
                    inputSize="md"
                    onChange={onChange}
                    hasError={Boolean(errors?.name)}
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
                    id="cycle_description"
                    name="description"
                    placeholder="Description..."
                    className="!h-24 w-full resize-none text-sm"
                    hasError={Boolean(errors?.description)}
                    value={value}
                    onChange={onChange}
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
                    name="end_date"
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
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100 pt-5 ">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={4}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={5}>
          {data ? (isSubmitting ? "Updating" : "Update cycle") : isSubmitting ? "Creating" : "Create cycle"}
        </Button>
      </div>
    </form>
  );
};
