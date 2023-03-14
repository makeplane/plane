export const GROUP_BY_OPTIONS: Array<{
  name: string;
  key: "state" | "priority" | "labels" | null;
}> = [
  { name: "State", key: "state" },
  { name: "Priority", key: "priority" },
  { name: "Labels", key: "labels" },
  { name: "None", key: null },
];

export const ORDER_BY_OPTIONS: Array<{
  name: string;
  key: "created_at" | "updated_at" | "priority" | "sort_order";
}> = [
  { name: "Manual", key: "sort_order" },
  { name: "Last created", key: "created_at" },
  { name: "Last updated", key: "updated_at" },
  { name: "Priority", key: "priority" },
];

export const FILTER_ISSUE_OPTIONS: Array<{
  name: string;
  key: "active" | "backlog" | null;
}> = [
  {
    name: "All",
    key: null,
  },
  {
    name: "Active Issues",
    key: "active",
  },
  {
    name: "Backlog Issues",
    key: "backlog",
  },
];

import { IIssue } from "types";

type THandleIssuesMutation = (
  formData: Partial<IIssue>,
  oldGroupTitle: string,
  selectedGroupBy: "state" | "priority" | "labels" | null,
  issueIndex: number,
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
  prevData
) => {
  if (!prevData) return prevData;

  if (Array.isArray(prevData)) {
    const updatedIssue = {
      ...prevData[issueIndex],
      ...formData,
      assignees: formData?.assignees_list ?? prevData[issueIndex]?.assignees_list,
    };

    prevData.splice(issueIndex, 1, updatedIssue);

    return [...prevData];
  } else {
    const oldGroup = prevData[oldGroupTitle ?? ""] ?? [];

    let newGroup: IIssue[] = [];

    if (selectedGroupBy === "priority") {
      newGroup = prevData[formData.priority ?? ""] ?? [];
    } else if (selectedGroupBy === "state") {
      newGroup = prevData[formData.state ?? ""] ?? [];
    }

    const updatedIssue = {
      ...oldGroup[issueIndex],
      ...formData,
      assignees: formData?.assignees_list ?? oldGroup[issueIndex]?.assignees_list,
    };

    oldGroup.splice(issueIndex, 1);
    newGroup.push(updatedIssue);

    const groupThatIsUpdated = selectedGroupBy === "priority" ? formData.priority : formData.state;

    return {
      ...prevData,
      [oldGroupTitle ?? ""]: oldGroup,
      [groupThatIsUpdated ?? ""]: newGroup,
    };
  }
};
