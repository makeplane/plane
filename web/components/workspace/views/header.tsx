import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateWorkspaceViewModal } from "components/workspace";
// icon
import { PlusIcon } from "lucide-react";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "constants/workspace";

export const GlobalViewsHeader: React.FC = observer(() => {
  const [createViewModal, setCreateViewModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug ? `GLOBAL_VIEWS_LIST_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => globalViewsStore.fetchAllGlobalViews(workspaceSlug.toString()) : null
  );

  // bring the active view to the centre of the header
  useEffect(() => {
    if (!globalViewId) return;

    const activeTabElement = document.querySelector(`#global-view-${globalViewId.toString()}`);

    if (activeTabElement) activeTabElement.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [globalViewId]);

  const isTabSelected = (tabKey: string) => router.pathname.includes(tabKey);
  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="group flex items-center px-4 w-full overflow-x-scroll relative border-b border-custom-border-200">
        {DEFAULT_GLOBAL_VIEWS_LIST.map((tab) => (
          <Link key={tab.key} href={`/${workspaceSlug}/workspace-views/${tab.key}`}>
            <a
              className={`border-b-2 min-w-min p-3 text-sm font-medium outline-none whitespace-nowrap flex-shrink-0 ${
                isTabSelected(tab.key)
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
              }`}
            >
              {tab.label}
            </a>
          </Link>
        ))}

        {globalViewsStore.globalViewsList?.map((view) => (
          <Link key={view.id} href={`/${workspaceSlug}/workspace-views/${view.id}`}>
            <a
              id={`global-view-${view.id}`}
              className={`border-b-2 p-3 text-sm font-medium outline-none whitespace-nowrap flex-shrink-0 ${
                view.id === globalViewId
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
              }`}
            >
              {view.name}
            </a>
          </Link>
        ))}

        <button
          type="button"
          className="flex items-center justify-center flex-shrink-0 sticky -right-4 w-12 py-3 border-transparent bg-custom-background-100 hover:border-custom-border-200 hover:text-custom-text-400"
          onClick={() => setCreateViewModal(true)}
        >
          <PlusIcon className="h-4 w-4 text-custom-primary-200" />
        </button>
      </div>
    </>
  );
});
