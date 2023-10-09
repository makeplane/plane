import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useWorkspaceMembers from "hooks/use-workspace-members";
// components
import { GlobalSelectFilters } from "components/workspace/views-legacy/global-select-filters";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IWorkspaceView } from "types";
// constants
import { AppliedFiltersList } from "components/issues";

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

  const { workspace: workspaceStore } = useMobxStore();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const memberOptions = workspaceMembers?.map((m) => m.member);

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

  console.log("selectedFilters", selectedFilters);

  useEffect(() => {
    if (!data) return;

    reset({ ...data });
  }, [data, reset]);

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
              name="query_data.filters"
              render={({ field: { onChange, value: filters } }) => (
                <GlobalSelectFilters
                  filters={filters}
                  onSelect={(option) => {
                    const key = option.key as keyof typeof filters;

                    const newValues = filters?.[key] ?? [];

                    if (Array.isArray(option.value)) {
                      option.value.forEach((val: any) => {
                        if (!newValues.includes(val)) newValues.push(val);
                      });
                    } else {
                      if (filters?.[key]?.includes(option.value)) newValues.splice(newValues.indexOf(option.value), 1);
                      else newValues.push(option.value);
                    }

                    onChange({
                      ...filters,
                      [key]: newValues,
                    });
                  }}
                />
              )}
            />
          </div>
          {selectedFilters && Object.keys(selectedFilters).length > 0 && (
            <div>
              <AppliedFiltersList
                appliedFilters={selectedFilters}
                handleClearAllFilters={clearAllFilters}
                handleRemoveFilter={() => {}}
                labels={workspaceStore.workspaceLabels}
                members={memberOptions}
                states={undefined}
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
