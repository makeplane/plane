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
import {
  CalendarMonthOutlined,
  FormatListBulletedOutlined,
  GridViewOutlined,
  TableChartOutlined,
  WaterfallChartOutlined,
} from "@mui/icons-material";
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
    Icon: FormatListBulletedOutlined,
  },
  {
    type: "kanban",
    Icon: GridViewOutlined,
  },
  {
    type: "calendar",
    Icon: CalendarMonthOutlined,
  },
  {
    type: "spreadsheet",
    Icon: TableChartOutlined,
  },
  {
    type: "gantt_chart",
    Icon: WaterfallChartOutlined,
  },
];

const issueViewForDraftIssues: { type: TIssueLayouts; Icon: any }[] = [
  {
    type: "list",
    Icon: FormatListBulletedOutlined,
  },
  {
    type: "kanban",
    Icon: GridViewOutlined,
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
