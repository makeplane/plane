import { useEffect } from "react";
import { E_FEATURE_FLAGS, EIssueLayoutTypes } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
import { TLayoutSelectionProps } from "@/ce/components/views/helper";
import { LayoutSelection } from "@/components/issues";
import { TWorkspaceLayoutProps } from "@/components/views/helper";
import { useIssues } from "@/hooks/store";
import { useFlag } from "@/plane-web/hooks/store";
import { WorkspaceGanttRoot } from "../issues/issue-layouts/gantt/root";

const ALLOWED_LAYOUTS = [EIssueLayoutTypes.SPREADSHEET, EIssueLayoutTypes.GANTT];

/**
 * @description Global view layout selection component
 * @param {TLayoutSelectionProps} props
 * @returns {React.ReactNode}
 */
export const GlobalViewLayoutSelection = ({ onChange, selectedLayout, workspaceSlug }: TLayoutSelectionProps) => {
  const isGanttLayoutEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.GLOBAL_VIEWS_TIMELINE);

  const {
    issuesFilter: { updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);

  /** To handle layout switch when downgraded and to reset default layout to SPREADSHEET*/
  useEffect(() => {
    const shouldSwitchToSpreadsheet =
      !ALLOWED_LAYOUTS.includes(selectedLayout) ||
      (!isGanttLayoutEnabled && selectedLayout === EIssueLayoutTypes.GANTT);

    if (shouldSwitchToSpreadsheet) {
      onChange(EIssueLayoutTypes.SPREADSHEET);
    }
  }, [isGanttLayoutEnabled, selectedLayout, workspaceSlug, updateFilters, onChange]);

  if (!isGanttLayoutEnabled) return null;

  return <LayoutSelection layouts={ALLOWED_LAYOUTS} onChange={onChange} selectedLayout={selectedLayout} />;
};

export const WorkspaceAdditionalLayouts = (props: TWorkspaceLayoutProps) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.GANTT:
      return <WorkspaceGanttRoot {...props} />;
    default:
      return null;
  }
};
