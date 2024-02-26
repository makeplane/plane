import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// store hooks
import { useEventTracker, useGlobalView, useUser } from "hooks/store";
// components
import { CreateUpdateWorkspaceViewModal } from "components/workspace";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST, EUserWorkspaceRoles } from "constants/workspace";
import { GLOBAL_VIEW_OPENED } from "constants/event-tracker";

const ViewTab = observer((props: { viewId: string }) => {
  const { viewId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;
  // store hooks
  const { getViewDetailsById } = useGlobalView();

  const view = getViewDetailsById(viewId);

  if (!view) return null;

  return (
    <Link key={viewId} id={`global-view-${viewId}`} href={`/${workspaceSlug}/workspace-views/${viewId}`}>
      <span
        className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
          viewId === globalViewId
            ? "border-custom-primary-100 text-custom-primary-100"
            : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
        }`}
      >
        {view.name}
      </span>
    </Link>
  );
});

export const GlobalViewsHeader: React.FC = observer(() => {
  // states
  const [createViewModal, setCreateViewModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;
  // store hooks
  const { currentWorkspaceViews } = useGlobalView();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
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
  }, [globalViewId, currentWorkspaceViews, containerRef]);

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="group relative flex border-b border-custom-border-200">
        <div
          ref={containerRef}
          className="flex w-full items-center overflow-x-auto px-4 horizontal-scrollbar scrollbar-sm"
        >
          {DEFAULT_GLOBAL_VIEWS_LIST.map((tab) => (
            <Link key={tab.key} id={`global-view-${tab.key}`} href={`/${workspaceSlug}/workspace-views/${tab.key}`}>
              <span
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                  tab.key === globalViewId
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          ))}

          {currentWorkspaceViews?.map((viewId) => (
            <ViewTab key={viewId} viewId={viewId} />
          ))}
        </div>

        {isAuthorizedUser && (
          <button
            type="button"
            className="sticky -right-4 flex w-12 flex-shrink-0 items-center justify-center border-transparent bg-custom-background-100 py-3 hover:border-custom-border-200 hover:text-custom-text-400"
            onClick={() => setCreateViewModal(true)}
          >
            <Plus className="h-4 w-4 text-custom-primary-200" />
          </button>
        )}
      </div>
    </>
  );
});
