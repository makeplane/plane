import { useEffect } from "react";
import { E_FEATURE_FLAGS, EIssueFilterType, EIssueLayoutTypes } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
import { TLayoutSelectionProps } from "@/ce/components/views/helper";
import { LayoutSelection } from "@/components/issues";
import { TWorkspaceLayoutProps } from "@/components/views/helper";
import { useIssues } from "@/hooks/store";
import { useFlag } from "@/plane-web/hooks/store";
import { WorkspaceGanttRoot } from "../issues/issue-layouts/gantt/root";

/**
 * @description Global view layout selection component
 * @param {TLayoutSelectionProps} props
 * @returns {React.ReactNode}
 */
export const GlobalViewLayoutSelection = ({ onChange, selectedLayout, workspaceSlug }: TLayoutSelectionProps) => {
  const isGanttLayoutEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.GLOBAL_VIEWS_TIMELINE);

  if (!isGanttLayoutEnabled) return null;

  return (
    <LayoutSelection
      layouts={[EIssueLayoutTypes.SPREADSHEET, EIssueLayoutTypes.GANTT]}
      onChange={onChange}
      selectedLayout={selectedLayout}
    />
  );
};

export const WorkspaceAdditionalLayouts = (props: TWorkspaceLayoutProps) => {
  const isGanttLayoutEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.GLOBAL_VIEWS_TIMELINE);

  const {
    issuesFilter: { updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);

  /** To handle layout switch when downgraded */
  useEffect(() => {
    if (!isGanttLayoutEnabled && props.activeLayout === EIssueLayoutTypes.GANTT) {
      updateFilters(
        props.workspaceSlug,
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: EIssueLayoutTypes.SPREADSHEET },
        props.globalViewId
      );
    }
  }, [isGanttLayoutEnabled, props.activeLayout, props.workspaceSlug, props.globalViewId, updateFilters]);

  switch (props.activeLayout) {
    case EIssueLayoutTypes.GANTT:
      return <WorkspaceGanttRoot {...props} />;
    default:
      return null;
  }
};
