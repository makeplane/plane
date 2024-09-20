import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Plus } from "lucide-react";
// types
import { TStaticViewTypes } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import {
  CreateUpdateWorkspaceViewModal,
  DefaultWorkspaceViewQuickActions,
  WorkspaceViewQuickActions,
} from "@/components/workspace";
// constants
import { GLOBAL_VIEW_OPENED } from "@/constants/event-tracker";
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@/constants/workspace";
// store hooks
import { useEventTracker, useGlobalView, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const ViewTab = observer((props: { viewId: string }) => {
  const { viewId } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const { workspaceSlug, globalViewId } = useParams();
  // store hooks
  const { getViewDetailsById } = useGlobalView();

  const view = getViewDetailsById(viewId);

  if (!view || !workspaceSlug || !globalViewId) return null;

  return (
    <div ref={parentRef} className="relative">
      <WorkspaceViewQuickActions
        parentRef={parentRef}
        view={view}
        viewId={viewId}
        globalViewId={globalViewId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
      />
    </div>
  );
});

const DefaultViewTab = (props: {
  tab: {
    key: TStaticViewTypes;
    label: string;
  };
}) => {
  const { tab } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const { workspaceSlug, globalViewId } = useParams();

  if (!workspaceSlug || !globalViewId) return null;
  return (
    <div key={tab.key} ref={parentRef} className="relative">
      <DefaultWorkspaceViewQuickActions
        parentRef={parentRef}
        globalViewId={globalViewId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
        view={tab}
      />
    </div>
  );
};

export const GlobalViewsHeader: React.FC = observer(() => {
  // states
  const [createViewModal, setCreateViewModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // router
  const { globalViewId } = useParams();
  // store hooks
  const { currentWorkspaceViews } = useGlobalView();
  const { allowPermissions } = useUserPermissions();

  const { captureEvent } = useEventTracker();

  // bring the active view to the centre of the header
  useEffect(() => {
    if (globalViewId && currentWorkspaceViews) {
      captureEvent(GLOBAL_VIEW_OPENED, {
        view_id: globalViewId,
        view_type: ["all-issues", "assigned", "created", "subscribed"].includes(globalViewId.toString())
          ? "Default"
          : "Custom",
      });
      const activeTabElement = document.querySelector(`#global-view-${globalViewId.toString()}`);
      if (activeTabElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const activeTabRect = activeTabElement.getBoundingClientRect();
        const diff = containerRect.right - activeTabRect.right;
        activeTabElement.scrollIntoView({ behavior: "smooth", inline: diff > 500 ? "center" : "nearest" });
      }
    }
  }, [globalViewId, currentWorkspaceViews, containerRef, captureEvent]);

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="min-h-[44px] z-[12] bg-custom-background-100">
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div
        ref={containerRef}
        className="flex h-full w-full items-center overflow-y-hidden overflow-x-auto horizontal-scrollbar scrollbar-sm"
      >
        {DEFAULT_GLOBAL_VIEWS_LIST.map((tab, index) => (
          <DefaultViewTab key={`${tab.key}-${index}`} tab={tab} />
        ))}

        {currentWorkspaceViews?.map((viewId) => <ViewTab key={viewId} viewId={viewId} />)}
      </div>

      {isAuthorizedUser ? (
        <button
          type="button"
          className="sticky -right-4 flex flex-shrink-0 items-center justify-center border-transparent bg-custom-background-100 py-3 hover:border-custom-border-200 hover:text-custom-text-400"
          onClick={() => setCreateViewModal(true)}
        >
          <Plus className="h-4 w-4 text-custom-primary-200" />
        </button>
      ) : (
        <></>
      )}
    </Header>
  );
});
