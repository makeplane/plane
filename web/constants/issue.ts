export const GROUP_BY_OPTIONS: Array<{
  name: string;
  key: TIssueGroupByOptions;
}> = [
  { name: localized("States"), key: "state" },
  { name: localized("State Groups"), key: "state_detail.group" },
  { name: localized("Priority"), key: "priority" },
  { name: localized("Project"), key: "project" },
  { name: localized("Labels"), key: "labels" },
  { name: localized("Assignees"), key: "assignees" },
  { name: localized("Created by"), key: "created_by" },
  { name: localized("None"), key: null },
];

export const ORDER_BY_OPTIONS: Array<{
  name: string;
  key: TIssueOrderByOptions;
}> = [
  { name: localized("Manual"), key: "sort_order" },
  { name: localized("Last created"), key: "-created_at" },
  { name: localized("Last updated"), key: "-updated_at" },
  { name: localized("Start date"), key: "start_date" },
  { name: localized("Priority"), key: "priority" },
];

export const FILTER_ISSUE_OPTIONS: Array<{
  name: string;
  key: "active" | "backlog" | null;
}> = [
  {
    name: localized("All"),
    key: null,
  },
  {
    name: localized("Active Issues"),
    key: "active",
  },
  {
    name: localized("Backlog Issues"),
    key: "backlog",
  },
];

import { orderArrayBy } from "helpers/array.helper";
import { localized } from "helpers/localization.helper";
import { IIssue, TIssueGroupByOptions, TIssueOrderByOptions } from "types";

type THandleIssuesMutation = (
  formData: Partial<IIssue>,
  oldGroupTitle: string,
  selectedGroupBy: TIssueGroupByOptions,
  issueIndex: number,
  orderBy: TIssueOrderByOptions,
  prevData?:
    | {
        [key: string]: IIssue[];
      }
    | IIssue[]
) =>
  | {
      [key: string]: IIssue[];
    }
  | IIssue[]
  | undefined;

export const handleIssuesMutation: THandleIssuesMutation = (
  formData,
  oldGroupTitle,
  selectedGroupBy,
  issueIndex,
  orderBy,
  prevData
) => {
  if (!prevData) return prevData;

  if (Array.isArray(prevData)) {
    const updatedIssue = {
      ...prevData[issueIndex],
      ...formData,
      assignees: formData?.assignees_list ?? prevData[issueIndex]?.assignees,
      labels: formData?.labels_list ?? prevData[issueIndex]?.labels,
    };

    prevData.splice(issueIndex, 1, updatedIssue);

    return [...prevData];
  } else {
    const oldGroup = prevData[oldGroupTitle ?? ""] ?? [];

    let newGroup: IIssue[] = [];

    if (selectedGroupBy === "priority") newGroup = prevData[formData.priority ?? ""] ?? [];
    else if (selectedGroupBy === "state") newGroup = prevData[formData.state ?? ""] ?? [];

    const updatedIssue = {
      ...oldGroup[issueIndex],
      ...formData,
      assignees: formData?.assignees_list ?? oldGroup[issueIndex]?.assignees,
      labels: formData?.labels_list ?? oldGroup[issueIndex]?.labels,
    };

    if (selectedGroupBy !== Object.keys(formData)[0])
      return {
        ...prevData,
        [oldGroupTitle ?? ""]: orderArrayBy(
          oldGroup.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)),
          orderBy
        ),
      };

    const groupThatIsUpdated = selectedGroupBy === "priority" ? formData.priority : formData.state;

    return {
      ...prevData,
      [oldGroupTitle ?? ""]: orderArrayBy(
        oldGroup.filter((i) => i.id !== updatedIssue.id),
        orderBy
      ),
      [groupThatIsUpdated ?? ""]: orderArrayBy([...newGroup, updatedIssue], orderBy),
    };
  }
};
