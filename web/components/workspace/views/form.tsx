import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
// hooks
import { useLabel, useMember } from "hooks/store";
// components
import { AppliedFiltersList, FilterSelection, FiltersDropdown } from "components/issues";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// types
import { IWorkspaceView } from "@plane/types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

type Props = {
  handleFormSubmit: (values: Partial<IWorkspaceView>) => Promise<void>;
  handleClose: () => void;
  data?: IWorkspaceView;
  preLoadedData?: Partial<IWorkspaceView>;
};

const defaultValues: Partial<IWorkspaceView> = {
  name: "",
  description: "",
};

export const WorkspaceViewForm: React.FC<Props> = observer((props) => {
  const { handleFormSubmit, handleClose, data, preLoadedData } = props;
  // store hooks
  const { workspaceLabels } = useLabel();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });

  const handleCreateUpdateView = async (formData: Partial<IWorkspaceView>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
      ...data,
    });
  }, [data, preLoadedData, reset]);

  const selectedFilters = watch("filters");

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("filters", {});
  };

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{data ? "Update" : "Create"} View</h3>
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
                  type="name"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Title"
                  className="w-full resize-none text-xl"
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
                  placeholder="Description"
                  onChange={onChange}
                  className="h-24 w-full resize-none text-sm"
                  hasError={Boolean(errors?.description)}
                />
              )}
            />
          </div>
          <div>
            <Controller
              control={control}
              name="filters"
              render={({ field: { onChange, value: filters } }) => (
                <FiltersDropdown title="Filters">
                  <FilterSelection
                    filters={filters ?? {}}
                    handleFiltersUpdate={(key, value) => {
                      const newValues = filters?.[key] ?? [];

                      if (Array.isArray(value)) {
                        value.forEach((val) => {
                          if (!newValues.includes(val)) newValues.push(val);
                        });
                      } else {
                        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
                        else newValues.push(value);
                      }

                      onChange({
                        ...filters,
                        [key]: newValues,
                      });
                    }}
                    layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                    labels={workspaceLabels ?? undefined}
                    memberIds={workspaceMemberIds ?? undefined}
                  />
                </FiltersDropdown>
              )}
            />
          </div>
          {selectedFilters && Object.keys(selectedFilters).length > 0 && (
            <div>
              <AppliedFiltersList
                appliedFilters={selectedFilters}
                handleClearAllFilters={clearAllFilters}
                handleRemoveFilter={() => {}}
                labels={workspaceLabels ?? undefined}
                states={undefined}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
          {data
            ? isSubmitting
              ? "Updating View..."
              : "Update View"
            : isSubmitting
            ? "Creating View..."
            : "Create View"}
        </Button>
      </div>
    </form>
  );
});
