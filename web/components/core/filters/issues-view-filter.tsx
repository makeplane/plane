import React from "react";

import { useRouter } from "next/router";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useIssuesView from "hooks/use-issues-view";
import useEstimateOption from "hooks/use-estimate-option";
// components
import { SelectFilters } from "components/views";
// ui
import { CustomMenu } from "components/ui";
import { ToggleSwitch, Tooltip } from "@plane/ui";
// icons
import { Calendar, Kanban, List, Sheet } from "lucide-react";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { Properties, TIssueLayouts } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS, ISSUE_ORDER_BY_OPTIONS, ISSUE_FILTER_OPTIONS } from "constants/issue";

const issueViewOptions: { type: TIssueLayouts; Icon: any }[] = [
  {
    type: "list",
    Icon: List,
  },
  {
    type: "kanban",
    Icon: Kanban,
  },
  {
    type: "calendar",
    Icon: Calendar,
  },
  {
    type: "spreadsheet",
    Icon: Sheet,
  },
  {
    type: "gantt_chart",
    Icon: GanttChart,
  },
];

const issueViewForDraftIssues: { type: TIssueLayouts; Icon: any }[] = [
  {
    type: "list",
    Icon: List,
  },
  {
    type: "kanban",
    Icon: Kanban,
  },
];

export const IssuesFilterView: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  const isArchivedIssues = router.pathname.includes("archived-issues");
  const isDraftIssues = router.pathname?.split("/")?.[4] === "draft-issues";

  const { displayFilters, setDisplayFilters, filters, setFilters, resetFilterToDefault, setNewFilterDefaultView } =
    useIssuesView();

  const [properties, setProperties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const { isEstimateActive } = useEstimateOption();

  return null;
};
