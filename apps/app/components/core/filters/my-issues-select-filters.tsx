import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
import projectService from "services/project.service";
import issuesService from "services/issues.service";
// components
import { DueDateFilterModal } from "components/core";
// ui
import { Avatar, MultiLevelDropdown } from "components/ui";
// icons
import { getPriorityIcon, getStateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { IIssueFilterOptions, IQuery } from "types";
// fetch-keys
import {
  PROJECT_ISSUE_LABELS,
  PROJECT_MEMBERS,
  STATES_LIST,
  WORKSPACE_LABELS,
} from "constants/fetch-keys";
// constants
import { GROUP_CHOICES, PRIORITIES } from "constants/project";
import { DUE_DATES } from "constants/due-dates";
import useWorkspaceMembers from "hooks/use-workspace-members";
import useUser from "hooks/use-user";

type Props = {
  filters: Partial<IIssueFilterOptions> | IQuery;
  onSelect: (option: any) => void;
  direction?: "left" | "right";
  height?: "sm" | "md" | "rg" | "lg";
};

export const MyIssuesSelectFilters: React.FC<Props> = ({
  filters,
  onSelect,
  direction = "right",
  height = "md",
}) => {
  const [isDueDateFilterModalOpen, setIsDueDateFilterModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

  const { workspaceMembers: members } = useWorkspaceMembers(workspaceSlug?.toString());

  const { data: labels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  return (
    <>
      {isDueDateFilterModalOpen && (
        <DueDateFilterModal
          isOpen={isDueDateFilterModalOpen}
          handleClose={() => setIsDueDateFilterModalOpen(false)}
        />
      )}
      <MultiLevelDropdown
        label="Filters"
        onSelect={onSelect}
        direction={direction}
        height={height}
        options={[
          {
            id: "priority",
            label: "Priority",
            value: PRIORITIES,
            children: [
              ...PRIORITIES.map((priority) => ({
                id: priority === null ? "null" : priority,
                label: (
                  <div className="flex items-center gap-2 capitalize">
                    {getPriorityIcon(priority)} {priority ?? "None"}
                  </div>
                ),
                value: {
                  key: "priority",
                  value: priority === null ? "null" : priority,
                },
                selected: filters?.priority?.includes(priority === null ? "null" : priority),
              })),
            ],
          },
          {
            id: "state_group",
            label: "State groups",
            value: GROUP_CHOICES,
            children: [
              ...Object.keys(GROUP_CHOICES).map((key) => ({
                id: key,
                label: (
                  <div className="flex items-center gap-2">
                    {getStateGroupIcon(key as any, "16", "16")}{" "}
                    {GROUP_CHOICES[key as keyof typeof GROUP_CHOICES]}
                  </div>
                ),
                value: {
                  key: "state_group",
                  value: key,
                },
                selected: filters?.state?.includes(key),
              })),
            ],
          },
          {
            id: "assignees",
            label: "Assignees",
            value: members,
            children: [
              ...(members
                ?.filter((m) => m.member.id !== user?.id)
                .map((member) => ({
                  id: member.member.id,
                  label: (
                    <div className="flex items-center gap-2">
                      <Avatar user={member.member} />
                      {member.member.first_name && member.member.first_name !== ""
                        ? member.member.first_name
                        : member.member.email}
                    </div>
                  ),
                  value: {
                    key: "assignees",
                    value: member.member.id,
                  },
                  selected: filters?.assignees?.includes(member.member.id),
                })) ?? []),
            ],
          },
          {
            id: "created_by",
            label: "Created by",
            value: members,
            children: [
              ...(members
                ?.filter((m) => m.member.id !== user?.id)
                .map((member) => ({
                  id: member.member.id,
                  label: (
                    <div className="flex items-center gap-2">
                      <Avatar user={member.member} />
                      {member.member.first_name && member.member.first_name !== ""
                        ? member.member.first_name
                        : member.member.email}
                    </div>
                  ),
                  value: {
                    key: "created_by",
                    value: member.member.id,
                  },
                  selected: filters?.created_by?.includes(member.member.id),
                })) ?? []),
            ],
          },
          {
            id: "labels",
            label: "Labels",
            value: labels,
            children: [
              ...(labels?.map((label) => ({
                id: label.id,
                label: (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          label.color && label.color !== "" ? label.color : "#000000",
                      }}
                    />
                    {label.name}
                  </div>
                ),
                value: {
                  key: "labels",
                  value: label.id,
                },
                selected: filters?.labels?.includes(label.id),
              })) ?? []),
            ],
          },
          {
            id: "target_date",
            label: "Due date",
            value: DUE_DATES,
            children: [
              ...(DUE_DATES?.map((option) => ({
                id: option.name,
                label: option.name,
                value: {
                  key: "target_date",
                  value: option.value,
                },
                selected: checkIfArraysHaveSameElements(filters?.target_date ?? [], option.value),
              })) ?? []),
              {
                id: "custom",
                label: "Custom",
                value: "custom",
                element: (
                  <button
                    onClick={() => setIsDueDateFilterModalOpen(true)}
                    className="w-full rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                  >
                    Custom
                  </button>
                ),
              },
            ],
          },
        ]}
      />
    </>
  );
};
