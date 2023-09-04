import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// components
import { DateFilterModal } from "components/core";
// ui
import { MultiLevelDropdown } from "components/ui";
// icons
import { getPriorityIcon, getStateGroupIcon } from "components/icons";
// helpers
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { IIssueFilterOptions, IQuery } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES, PRIORITIES } from "constants/project";
import { DATE_FILTER_OPTIONS } from "constants/filters";

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
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<{
    title: string;
    type: "start_date" | "target_date";
  }>({
    title: "",
    type: "start_date",
  });
  const [fetchLabels, setFetchLabels] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: labels } = useSWR(
    workspaceSlug && fetchLabels ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug && fetchLabels
      ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString())
      : null
  );

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          title={dateFilterType.title}
          field={dateFilterType.type}
          isOpen={isDateFilterModalOpen}
          handleClose={() => setIsDateFilterModalOpen(false)}
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
            hasChildren: true,
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
            hasChildren: true,
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
            id: "labels",
            label: "Labels",
            onClick: () => setFetchLabels(true),
            value: labels,
            hasChildren: true,
            children: labels?.map((label) => ({
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
              ...(DATE_FILTER_OPTIONS?.map((option) => ({
                id: option.name,
                label: option.name,
                value: {
                  key: "start_date",
                  value: option.value,
                },
                selected: checkIfArraysHaveSameElements(filters?.start_date ?? [], option.value),
              })) ?? []),
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
              ...(DATE_FILTER_OPTIONS?.map((option) => ({
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
        ]}
      />
    </>
  );
};
