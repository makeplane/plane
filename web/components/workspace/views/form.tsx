import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import issuesService from "services/issues.service";

// hooks
import useProjects from "hooks/use-projects";
import useWorkspaceMembers from "hooks/use-workspace-members";
// components
import { WorkspaceFiltersList } from "components/core";
import { GlobalSelectFilters } from "components/workspace/views/global-select-filters";

// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// helpers
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { IQuery } from "types";
import { IWorkspaceView } from "types/workspace-views";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";
import { STATE_GROUP } from "constants/project";

type Props = {
  handleFormSubmit: (values: IWorkspaceView) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IWorkspaceView | null;
  preLoadedData?: Partial<IWorkspaceView> | null;
};

const defaultValues: Partial<IWorkspaceView> = {
  name: "",
  description: "",
};

export const WorkspaceViewForm: React.FC<Props> = ({
  handleFormSubmit,
  handleClose,
  status,
  data,
  preLoadedData,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<any>({
    defaultValues,
  });
  const filters = watch("query");

  const { data: labelOptions } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const memberOptions = workspaceMembers?.map((m) => m.member);

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  const handleCreateUpdateView = async (formData: IWorkspaceView) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  const clearAllFilters = () => {
    setValue("query", {
      assignees: null,
      created_by: null,
      subscriber: null,
      labels: null,
      priority: null,
      state_group: null,
      start_date: null,
      target_date: null,
      project: null,
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
            <GlobalSelectFilters
              filters={filters}
              onSelect={(option) => {
                const key = option.key as keyof typeof filters;

                if (key === "start_date" || key === "target_date") {
                  const valueExists = checkIfArraysHaveSameElements(
                    filters?.[key] ?? [],
                    option.value
                  );

                  setValue("query", {
                    ...filters,
                    [key]: valueExists ? null : option.value,
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
            <WorkspaceFiltersList
              filters={filters}
              labels={labelOptions}
              members={memberOptions}
              project={joinedProjects}
              stateGroup={STATE_GROUP}
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
