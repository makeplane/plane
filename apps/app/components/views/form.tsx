import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { useForm } from "react-hook-form";
// ui
import { Avatar, Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IView } from "types";
// constant
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS, STATE_LIST } from "constants/fetch-keys";
// helpers
import { getStatesList } from "helpers/state.helper";
// services
import stateService from "services/state.service";
import projectService from "services/project.service";
import issuesService from "services/issues.service";
// components
import { SelectFilters } from "components/views";
// icons
import { getStateGroupIcon } from "components/icons";
import { getPriorityIcon } from "components/icons/priority-icon";
// components

type Props = {
  handleFormSubmit: (values: IView) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IView;
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

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const statesList = getStatesList(states ?? {});

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels } = useSWR(
    projectId ? PROJECT_ISSUE_LABELS(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId.toString())
      : null
  );

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

  const handleCreateUpdateView = async (formData: IView) => {
    await handleFormSubmit(formData);

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

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
    });
  }, [preLoadedData, reset]);

  const filters = watch("query");

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} View
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              label="Name"
              name="name"
              type="name"
              placeholder="Enter name"
              autoComplete="off"
              error={errors.name}
              register={register}
              validations={{
                required: "Name is required",
                maxLength: {
                  value: 255,
                  message: "Name should be less than 255 characters",
                },
              }}
            />
          </div>
          <div>
            <TextArea
              id="description"
              name="description"
              label="Description"
              placeholder="Enter description"
              error={errors.description}
              register={register}
            />
          </div>
          <div>
            <SelectFilters
              filters={filters}
              onSelect={(option) => {
                const key = option.key as keyof typeof filters;

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
              }}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-4">
              {Object.keys(filters ?? {}).map((key) => {
                const queryKey = key as keyof typeof filters;
                if (queryKey === "state")
                  return (
                    <div className="flex gap-3" key={key}>
                      {filters.state?.map((stateID) => {
                        const state = statesList.find((state) => state.id === stateID);
                        if (!state) return null;
                        return (
                          <div
                            className="flex items-center gap-2 rounded-full border bg-white px-2 py-1.5 text-xs"
                            key={state.id}
                          >
                            {getStateGroupIcon(state?.group, "16", "16", state?.color)}
                            {state?.name}
                          </div>
                        );
                      })}
                    </div>
                  );
                else if (queryKey === "priority")
                  return (
                    <div className="flex gap-3" key={key}>
                      {filters.priority?.map((priority) => (
                        <div
                          className="flex items-center gap-2 rounded-full border bg-white px-2 py-1.5 text-xs"
                          key={priority}
                        >
                          {getPriorityIcon(priority)}
                          {priority}
                        </div>
                      ))}
                    </div>
                  );
                else if (queryKey === "assignees")
                  return (
                    <div className="flex gap-3" key={key}>
                      {filters.assignees?.map((assigneeId) => {
                        const member = members?.find((member) => member.member.id === assigneeId);

                        if (!member) return null;
                        return (
                          <div
                            className="flex items-center gap-2 rounded-full border bg-white px-1.5 py-1 text-xs"
                            key={member.member.id}
                          >
                            <Avatar user={member.member} />
                            {member.member.first_name && member.member.first_name !== ""
                              ? member.member.first_name
                              : member.member.email}
                          </div>
                        );
                      })}
                    </div>
                  );
                else if (queryKey === "labels")
                  return (
                    <div className="flex gap-3" key={key}>
                      <div className="flex items-center gap-x-1">
                        {filters.labels?.map((labelId: string) => {
                          const label = issueLabels?.find((l) => l.id === labelId);
                          if (!label) return null;
                          return (
                            <div className="flex items-center gap-1 rounded-full border bg-white px-1.5 py-1 text-xs">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    label.color && label.color !== "" ? label.color : "#000000",
                                }}
                              />
                              {label.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
              })}
            </div>
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
