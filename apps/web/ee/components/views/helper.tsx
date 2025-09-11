import { useEffect } from "react";
import { Lock, LockIcon, LockOpen } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import {
  TLayoutSelectionProps,
  TMenuItemsFactoryProps,
  useMenuItemsFactory as useCoreMenuItemsFactory,
} from "@/ce/components/views/helper";
import { LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { TWorkspaceLayoutProps } from "@/components/views/helper";
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectView } from "@/hooks/store/use-project-view";
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

const useMenuItemsFactory = (props: TMenuItemsFactoryProps) => {
  const { isLocked, workspaceSlug, projectId, viewId } = props;
  const factory = useCoreMenuItemsFactory(props);

  const { lockView: lockProjectView, unLockView: unLockProjectView } = useProjectView();

  const { lockView: lockGlobalView, unLockView: unLockGlobalView } = useGlobalView();

  const handleToggleResult = (promise: Promise<unknown>) => {
    promise
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: isLocked ? "View unlocked successfully." : "View locked successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: isLocked
            ? "View could not be unlocked. Please try again later."
            : "View could not be locked. Please try again later.",
        });
      });
  };

  const toggleViewLock = () => {
    if (projectId) {
      const operation = isLocked ? unLockProjectView : lockProjectView;
      return handleToggleResult(operation(workspaceSlug, projectId, viewId));
    }
    const operation = isLocked ? unLockGlobalView : lockGlobalView;
    return handleToggleResult(operation(workspaceSlug, viewId));
  };

  const toggleLockMenuItem = () => ({
    key: "toggle-lock",
    action: () => toggleViewLock(),
    title: isLocked ? "Unlock" : "Lock",
    icon: isLocked ? LockOpen : Lock,
  });

  return {
    ...factory,
    toggleLockMenuItem,
  };
};

export const useViewMenuItems = (props: TMenuItemsFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemsFactory(props);

  const isViewLockEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.VIEW_LOCK);

  return [
    factory.editMenuItem(),
    isViewLockEnabled ? factory.toggleLockMenuItem() : null,
    factory.openInNewTabMenuItem(),
    factory.copyLinkMenuItem(),
    factory.deleteMenuItem(),
  ].filter(Boolean) as TContextMenuItem[];
};

export const AdditionalHeaderItems = ({ isLocked }: { isLocked: boolean }) => {
  if (!isLocked) return null;
  return (
    <div className="h-6 min-w-[76px] flex items-center justify-center gap-1.5 px-2 rounded text-custom-primary-100 bg-custom-primary-100/20 text-xs font-medium">
      <LockIcon className="size-3.5 flex-shrink-0" /> Locked
    </div>
  );
};
