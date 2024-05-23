import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { IProjectView, IIssueFilterOptions } from "@plane/types";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// components
import { AppliedFiltersList, FilterSelection, FiltersDropdown } from "@/components/issues";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// hooks
import { useLabel, useMember, useProject, useProjectState } from "@/hooks/store";

type Props = {
  data?: IProjectView | null;
  handleClose: () => void;
  handleFormSubmit: (values: IProjectView) => Promise<void>;
  preLoadedData?: Partial<IProjectView> | null;
};

const defaultValues: Partial<IProjectView> = {
  name: "",
  description: "",
};

export const ProjectViewForm: React.FC<Props> = observer((props) => {
  const { handleFormSubmit, handleClose, data, preLoadedData } = props;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<IProjectView>({
    defaultValues,
  });

  const selectedFilters: IIssueFilterOptions = {};
  Object.entries(watch("filters") ?? {}).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    selectedFilters[key as keyof IIssueFilterOptions] = value;
  });

  // for removing filters from a key
  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    // If value is null then remove all the filters of that key
    if (!value) {
      setValue("filters", {
        ...selectedFilters,
        [key]: null,
      });
      return;
    }

    const newValues = selectedFilters?.[key] ?? [];

    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (newValues.includes(val)) newValues.splice(newValues.indexOf(val), 1);
      });
    } else {
      if (selectedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    }

    setValue("filters", {
      ...selectedFilters,
      [key]: newValues,
    });
  };

  const handleCreateUpdateView = async (formData: IProjectView) => {
    await handleFormSubmit({
      name: formData.name,
      description: formData.description,
      filters: formData.filters,
    } as IProjectView);

    reset({
      ...defaultValues,
    });
  };

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("filters", {});
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
      ...data,
    });
  }, [data, preLoadedData, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5 p-5">
        <h3 className="text-xl font-medium text-custom-text-200">{data ? "Update" : "Create"} View</h3>
        <div className="space-y-3">
          <div className="space-y-1">
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
              render={({ field: { value, onChange } }) => (
                <Input
                  id="name"
                  type="name"
                  name="name"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.name)}
                  placeholder="Title"
                  className="w-full text-base"
                  tabIndex={1}
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
                  id="description"
                  name="description"
                  placeholder="Description"
                  className="w-full text-base resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                  value={value}
                  onChange={onChange}
                  tabIndex={2}
                />
              )}
            />
          </div>
          <div>
            <Controller
              control={control}
              name="filters"
              render={({ field: { onChange, value: filters } }) => (
                <FiltersDropdown title="Filters" tabIndex={3}>
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
                    layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.list}
                    labels={projectLabels ?? undefined}
                    memberIds={projectMemberIds ?? undefined}
                    states={projectStates}
                    cycleViewDisabled={!currentProjectDetails?.cycle_view}
                    moduleViewDisabled={!currentProjectDetails?.module_view}
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
                handleRemoveFilter={handleRemoveFilter}
                labels={projectLabels ?? []}
                states={projectStates}
              />
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={4}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" tabIndex={5} loading={isSubmitting}>
          {data ? (isSubmitting ? "Updating" : "Update View") : isSubmitting ? "Creating" : "Create View"}
        </Button>
      </div>
    </form>
  );
});
