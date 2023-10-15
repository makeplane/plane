import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectStateService, ProjectService } from "services/project";
import { IssueLabelService } from "services/issue";
// components
import { DateFilterModal } from "components/core";
// ui
import { Avatar, MultiLevelDropdown } from "components/ui";
// icons
import { PriorityIcon, StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { IIssueFilterOptions } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS, STATES_LIST } from "constants/fetch-keys";
// constants
import { PRIORITIES } from "constants/project";
import { DATE_FILTER_OPTIONS } from "constants/filters";

type Props = {
  filters: Partial<IIssueFilterOptions>;
  onSelect: (option: any) => void;
  direction?: "left" | "right";
  height?: "sm" | "md" | "rg" | "lg";
};

const projectService = new ProjectService();
const projectStateService = new ProjectStateService();
const issueLabelService = new IssueLabelService();

export const SelectFilters: React.FC<Props> = ({ filters, onSelect, direction = "right", height = "md" }) => {
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<{
    title: string;
    type: "start_date" | "target_date";
  }>({
    title: "",
    type: "start_date",
  });

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectStateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const statesList = getStatesList(states);

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels } = useSWR(
    projectId ? PROJECT_ISSUE_LABELS(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => issueLabelService.getProjectIssueLabels(workspaceSlug as string, projectId.toString())
      : null
  );

  const projectFilterOption = [
    {
      id: "priority",
      label: "Priority",
      value: PRIORITIES,
      hasChildren: true,
      children: PRIORITIES.map((priority) => ({
        id: priority === null ? "null" : priority,
        label: (
          <div className="flex items-center gap-2 capitalize">
            <PriorityIcon priority={priority} />
            {priority ?? "None"}
          </div>
        ),
        value: {
          key: "priority",
          value: priority === null ? "null" : priority,
        },
        selected: filters?.priority?.includes(priority === null ? "null" : priority),
      })),
    },
    {
      id: "state",
      label: "State",
      value: statesList,
      hasChildren: true,
      children: statesList?.map((state) => ({
        id: state.id,
        label: (
          <div className="flex items-center gap-2">
            <StateGroupIcon stateGroup={state.group} color={state.color} />
            {state.name}
          </div>
        ),
        value: {
          key: "state",
          value: state.id,
        },
        selected: filters?.state?.includes(state.id),
      })),
    },
    {
      id: "assignees",
      label: "Assignees",
      value: members,
      hasChildren: true,
      children: members?.map((member) => ({
        id: member.member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar user={member.member} />
            {member.member.display_name}
          </div>
        ),
        value: {
          key: "assignees",
          value: member.member.id,
        },
        selected: filters?.assignees?.includes(member.member.id),
      })),
    },
    {
      id: "created_by",
      label: "Created by",
      value: members,
      hasChildren: true,
      children: members?.map((member) => ({
        id: member.member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar user={member.member} />
            {member.member.display_name}
          </div>
        ),
        value: {
          key: "created_by",
          value: member.member.id,
        },
        selected: filters?.created_by?.includes(member.member.id),
      })),
    },
    {
      id: "labels",
      label: "Labels",
      value: issueLabels,
      hasChildren: true,
      children: issueLabels?.map((label) => ({
        id: label.id,
        label: (
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: label.color && label.color !== "" ? label.color : "#000000",
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
      })),
    },
    {
      id: "start_date",
      label: "Start date",
      value: DATE_FILTER_OPTIONS,
      hasChildren: true,
      children: [
        ...DATE_FILTER_OPTIONS.map((option) => ({
          id: option.name,
          label: option.name,
          value: {
            key: "start_date",
            value: option.value,
          },
          selected: checkIfArraysHaveSameElements(filters?.start_date ?? [], [option.value]),
        })),
        {
          id: "custom",
          label: "Custom",
          value: "custom",
          element: (
            <button
              onClick={() => {
                setIsDateFilterModalOpen(true);
                setDateFilterType({
                  title: "Start date",
                  type: "start_date",
                });
              }}
              className="w-full rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
            >
              Custom
            </button>
          ),
        },
      ],
    },
    {
      id: "target_date",
      label: "Due date",
      value: DATE_FILTER_OPTIONS,
      hasChildren: true,
      children: [
        ...DATE_FILTER_OPTIONS.map((option) => ({
          id: option.name,
          label: option.name,
          value: {
            key: "target_date",
            value: option.value,
          },
          selected: checkIfArraysHaveSameElements(filters?.target_date ?? [], [option.value]),
        })),
        {
          id: "custom",
          label: "Custom",
          value: "custom",
          element: (
            <button
              onClick={() => {
                setIsDateFilterModalOpen(true);
                setDateFilterType({
                  title: "Due date",
                  type: "target_date",
                });
              }}
              className="w-full rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
            >
              Custom
            </button>
          ),
        },
      ],
    },
  ];
  return (
    <>
      {/* {isDateFilterModalOpen && (
        <DateFilterModal
          title={dateFilterType.title}
          field={dateFilterType.type}
          filters={filters as IIssueFilterOptions}
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={onSelect}
        />
      )} */}
      <MultiLevelDropdown
        label="Filters"
        onSelect={onSelect}
        direction={direction}
        height={height}
        options={projectFilterOption}
      />
    </>
  );
};
