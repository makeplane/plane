import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import stateService from "services/state.service";
// hooks
import useProjectMembers from "hooks/use-project-members";
// components
import { FiltersList } from "components/core";
import { SelectFilters } from "components/views";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// helpers
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IQuery, IView } from "types";
import issuesService from "services/issues.service";
// fetch-keys
import { PROJECT_ISSUE_LABELS, STATES_LIST } from "constants/fetch-keys";

type Props = {
  handleFormSubmit: (values: IView) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IView | null;
  preLoadedData?: Partial<IView> | null;
};

const defaultValues: Partial<IView> = {
  name: "",
  description: "",
};

export const ViewForm: React.FC<Props> = ({
  handleFormSubmit,
  handleClose,
  status,
  data,
  preLoadedData,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<IView>({
    defaultValues,
  });
  const filters = watch("query");

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId && (filters?.state ?? []).length > 0
      ? STATES_LIST(projectId as string)
      : null,
    workspaceSlug && (filters?.state ?? []).length > 0
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups);

  const { data: labels } = useSWR(
    workspaceSlug && projectId && (filters?.labels ?? []).length > 0
      ? PROJECT_ISSUE_LABELS(projectId.toString())
      : null,
    workspaceSlug && projectId && (filters?.labels ?? []).length > 0
      ? () => issuesService.getIssueLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );
  const { members } = useProjectMembers(workspaceSlug?.toString(), projectId?.toString());

  const handleCreateUpdateView = async (formData: IView) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  const clearAllFilters = () => {
    setValue("query", {
      assignees: null,
      created_by: null,
      labels: null,
      priority: null,
      state: null,
      target_date: null,
      type: null,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
      ...data,
    });
  }, [data, preLoadedData, reset]);

  useEffect(() => {
    if (status && data) {
      setValue("query", data.query_data);
    }
  }, [data, status, setValue]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {status ? "Update" : "Create"} View
        </h3>
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
            <SelectFilters
              filters={filters}
              onSelect={(option) => {
                const key = option.key as keyof typeof filters;

                if (key === "target_date") {
                  const valueExists = checkIfArraysHaveSameElements(
                    filters?.target_date ?? [],
                    option.value
                  );

                  setValue("query", {
                    target_date: valueExists ? null : option.value,
                  } as IQuery);
                } else {
                  if (!filters?.[key]?.includes(option.value))
                    setValue("query", {
                      ...filters,
                      [key]: [...((filters?.[key] as any[]) ?? []), option.value],
                    });
                  else {
                    setValue("query", {
                      ...filters,
                      [key]: (filters?.[key] as any[])?.filter((item) => item !== option.value),
                    });
                  }
                }
              }}
            />
          </div>
          <div>
            <FiltersList
              filters={filters}
              labels={labels}
              members={members?.map((m) => m.member)}
              states={states}
              clearAllFilters={clearAllFilters}
              setFilters={(query: any) => {
                setValue("query", {
                  ...filters,
                  ...query,
                });
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
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
};
