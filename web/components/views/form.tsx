import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList, FilterSelection, FiltersDropdown } from "components/issues";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IProjectView } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

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

export const ProjectViewForm: React.FC<Props> = observer(({ handleFormSubmit, handleClose, data, preLoadedData }) => {
  const { project: projectStore } = useMobxStore();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<IProjectView>({
    defaultValues,
  });

  const selectedFilters = watch("query_data");

  const handleCreateUpdateView = async (formData: IProjectView) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("query_data", {});
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
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{data ? "Update" : "Create"} View</h3>
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
          <div>
            <Controller
              control={control}
              name="query_data"
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
                    layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.list}
                    labels={projectStore.projectLabels ?? undefined}
                    members={projectStore.projectMembers?.map((m) => m.member) ?? undefined}
                    states={projectStore.projectStatesByGroups ?? undefined}
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
                labels={projectStore.projectLabels ?? undefined}
                members={projectStore.projectMembers?.map((m) => m.member) ?? undefined}
                states={projectStore.projectStatesByGroups ?? undefined}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {data
            ? isSubmitting
              ? "Updating View..."
              : "Update View"
            : isSubmitting
            ? "Creating View..."
            : "Create View"}
        </PrimaryButton>
      </div>
    </form>
  );
});
