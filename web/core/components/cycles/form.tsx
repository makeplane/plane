"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// types
import { ICycle } from "@plane/types";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// components
import { DateRangeDropdown, ProjectDropdown } from "@/components/dropdowns";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldRenderProject } from "@/helpers/project.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>, dirtyFields: any) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: (projectId: string) => void;
  data?: ICycle | null;
  isMobile?: boolean;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export const CycleForm: React.FC<Props> = (props) => {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data, isMobile = false } = props;
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

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CYCLE, isMobile);

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit((formData) => handleFormSubmit(formData, dirtyFields))}>
      <div className="space-y-5 p-5">
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
                    renderCondition={(project) => shouldRenderProject(project)}
                    tabIndex={getIndex("cover_image")}
                  />
                </div>
              )}
            />
          )}
          <h3 className="text-xl font-medium text-custom-text-200">{status ? "Update" : "Create"} cycle</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  name="name"
                  type="text"
                  placeholder="Title"
                  className="w-full text-base"
                  value={value}
                  inputSize="md"
                  onChange={onChange}
                  hasError={Boolean(errors?.name)}
                  tabIndex={getIndex("description")}
                  autoFocus
                />
              )}
            />
            <span className="text-xs text-red-500">{errors?.name?.message}</span>
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  name="description"
                  placeholder="Description"
                  className="w-full text-base resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                  value={value}
                  onChange={onChange}
                  tabIndex={getIndex("description")}
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
                        from: getDate(startDateValue),
                        to: getDate(endDateValue),
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
                      tabIndex={getIndex("date_range")}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={getIndex("cancel")}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={getIndex("submit")}>
          {data ? (isSubmitting ? "Updating" : "Update Cycle") : isSubmitting ? "Creating" : "Create Cycle"}
        </Button>
      </div>
    </form>
  );
};
