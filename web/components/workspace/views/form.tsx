import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList, FilterSelection, FiltersDropdown } from "components/issues";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// types
import { IWorkspaceView } from "types";
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

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { workspace: workspaceStore, project: projectStore } = useMobxStore();

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

  const selectedFilters = watch("query_data")?.filters;

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("query_data.filters", {});
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
                  className="resize-none text-xl w-full"
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
                  className="h-32 resize-none text-sm"
                  hasError={Boolean(errors?.description)}
                />
              )}
            />
          </div>
          <div>
            <Controller
              control={control}
              name="query_data.filters"
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
                    labels={workspaceStore.workspaceLabels ?? undefined}
                    projects={workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined}
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
                labels={workspaceStore.workspaceLabels ?? undefined}
                members={workspaceStore.workspaceMembers?.map((m) => m.member) ?? undefined}
                states={undefined}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="neutral-primary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
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
