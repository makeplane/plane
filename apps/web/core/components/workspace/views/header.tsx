import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { PlusIcon } from "@plane/propel/icons";
import type { TStaticViewTypes } from "@plane/types";
import { Header, EHeaderVariant } from "@plane/ui";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { DefaultWorkspaceViewQuickActions } from "./default-view-quick-action";
import { CreateUpdateWorkspaceViewModal } from "./modal";
import { WorkspaceViewQuickActions } from "./quick-action";

const ViewTab = observer(function ViewTab(props: { viewId: string }) {
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
      <WorkspaceViewQuickActions workspaceSlug={workspaceSlug?.toString()} view={view} />
    </div>
  );
});

function DefaultViewTab(props: {
  tab: {
    key: TStaticViewTypes;
    i18n_label: string;
  };
}) {
  const { tab } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const { workspaceSlug, globalViewId } = useParams();

  if (!workspaceSlug || !globalViewId) return null;
  return (
    <div key={tab.key} ref={parentRef} className="relative">
      <DefaultWorkspaceViewQuickActions workspaceSlug={workspaceSlug?.toString()} view={tab} />
    </div>
  );
}

export const GlobalViewsHeader = observer(function GlobalViewsHeader() {
  // states
  const [createViewModal, setCreateViewModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // router
  const { globalViewId } = useParams();
  // store hooks
  const { currentWorkspaceViews } = useGlobalView();
  const { allowPermissions } = useUserPermissions();

  // bring the active view to the centre of the header
  useEffect(() => {
    if (globalViewId && currentWorkspaceViews) {
      const activeTabElement = document.querySelector(`#global-view-${globalViewId.toString()}`);
      if (activeTabElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const activeTabRect = activeTabElement.getBoundingClientRect();
        const diff = containerRect.right - activeTabRect.right;
        activeTabElement.scrollIntoView({ behavior: "smooth", inline: diff > 500 ? "center" : "nearest" });
      }
    }
  }, [globalViewId, currentWorkspaceViews, containerRef]);

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="min-h-[44px] z-[12] bg-surface-1">
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div
        ref={containerRef}
        className="flex h-full w-full items-center overflow-y-hidden overflow-x-auto horizontal-scrollbar scrollbar-sm"
      >
        {DEFAULT_GLOBAL_VIEWS_LIST.map((tab, index) => (
          <DefaultViewTab key={`${tab.key}-${index}`} tab={tab} />
        ))}

        {currentWorkspaceViews?.map((viewId) => (
          <ViewTab key={viewId} viewId={viewId} />
        ))}
      </div>

      {isAuthorizedUser ? (
        <button
          type="button"
          className="sticky -right-4 flex flex-shrink-0 items-center justify-center border-transparent bg-surface-1 py-3 hover:border-subtle hover:text-placeholder"
          onClick={() => setCreateViewModal(true)}
        >
          <PlusIcon className="h-4 w-4 text-accent-secondary" />
        </button>
      ) : (
        <></>
      )}
    </Header>
  );
});
