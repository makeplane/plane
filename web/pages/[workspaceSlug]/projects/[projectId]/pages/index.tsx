import { useState, Fragment, ReactElement } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { RecentPagesList, CreateUpdatePageModal, TPagesListProps } from "components/pages";
import { PagesHeader } from "components/headers";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TPageViewProps } from "types";
import { NextPageWithLayout } from "types/app";
// constants
import { PAGE_TABS_LIST, PAGE_VIEW_LAYOUTS } from "constants/page";

const AllPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.AllPagesList), {
  ssr: false,
});

const FavoritePagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.FavoritePagesList), {
  ssr: false,
});

const MyPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.MyPagesList), {
  ssr: false,
});

const OtherPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.OtherPagesList), {
  ssr: false,
});

const ProjectPagesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [viewType, setViewType] = useState<TPageViewProps>("list");

  const { user } = useUserAuth();

  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "Recent":
        return 0;
      case "All":
        return 1;
      case "Favorites":
        return 2;
      case "Created by me":
        return 3;
      case "Created by others":
        return 4;

      default:
        return 0;
    }
  };

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdatePageModal
          isOpen={createUpdatePageModal}
          handleClose={() => setCreateUpdatePageModal(false)}
          user={user}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      )}
      <div className="space-y-5 p-8 h-full overflow-hidden flex flex-col">
        <div className="flex gap-4 justify-between">
          <h3 className="text-2xl font-semibold text-custom-text-100">Pages</h3>
          <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
            {PAGE_VIEW_LAYOUTS.map((layout) => (
              <Tooltip key={layout.key} tooltipContent={layout.title}>
                <button
                  type="button"
                  className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
                    viewType == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                  }`}
                  onClick={() => setViewType(layout.key as TPageViewProps)}
                >
                  <layout.icon
                    strokeWidth={2}
                    className={`h-3.5 w-3.5 ${
                      viewType == layout.key ? "text-custom-text-100" : "text-custom-text-200"
                    }`}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
        <Tab.Group
          as={Fragment}
          defaultIndex={currentTabValue(pageTab)}
          onChange={(i) => {
            switch (i) {
              case 0:
                return setPageTab("Recent");
              case 1:
                return setPageTab("All");
              case 2:
                return setPageTab("Favorites");
              case 3:
                return setPageTab("Created by me");
              case 4:
                return setPageTab("Created by others");

              default:
                return setPageTab("Recent");
            }
          }}
        >
          <Tab.List as="div" className="mb-6 flex items-center justify-between">
            <div className="flex gap-4 items-center flex-wrap">
              {PAGE_TABS_LIST.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    `rounded-full border px-5 py-1.5 text-sm outline-none ${
                      selected
                        ? "border-custom-primary bg-custom-primary text-white"
                        : "border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90"
                    }`
                  }
                >
                  {tab.title}
                </Tab>
              ))}
            </div>
          </Tab.List>
          <Tab.Panels as={Fragment}>
            <Tab.Panel as="div" className="h-full overflow-y-auto space-y-5">
              <RecentPagesList viewType={viewType} />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <AllPagesList viewType={viewType} />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <FavoritePagesList viewType={viewType} />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <MyPagesList viewType={viewType} />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <OtherPagesList viewType={viewType} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
};

ProjectPagesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PagesHeader showButton />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectPagesPage;
