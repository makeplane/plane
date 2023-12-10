import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateWorkspaceViewModal } from "components/workspace";
// icon
import { Plus } from "lucide-react";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "constants/workspace";

export const GlobalViewsHeader: React.FC = observer(() => {
  const [createViewModal, setCreateViewModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

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
      <div className="group relative flex w-full items-center overflow-x-scroll border-b border-custom-border-200 px-4">
        {DEFAULT_GLOBAL_VIEWS_LIST.map((tab) => (
          <Link key={tab.key} href={`/${workspaceSlug}/workspace-views/${tab.key}`}>
            <span
              className={`min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                isTabSelected(tab.key)
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}

        {globalViewsStore.globalViewsList?.map((view) => (
          <Link key={view.id} href={`/${workspaceSlug}/workspace-views/${view.id}`}>
            <span
              id={`global-view-${view.id}`}
              className={`flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                view.id === globalViewId
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
              }`}
            >
              {view.name}
            </span>
          </Link>
        ))}

        <button
          type="button"
          className="sticky -right-4 flex w-12 flex-shrink-0 items-center justify-center border-transparent bg-custom-background-100 py-3 hover:border-custom-border-200 hover:text-custom-text-400"
          onClick={() => setCreateViewModal(true)}
        >
          <Plus className="h-4 w-4 text-custom-primary-200" />
        </button>
      </div>
    </>
  );
});
