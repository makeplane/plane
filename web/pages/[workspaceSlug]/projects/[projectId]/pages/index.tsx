import { useState, Fragment, ReactElement } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Tab } from "@headlessui/react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { RecentPagesList, CreateUpdatePageModal } from "components/pages";
import { PagesHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";
// constants
import { PAGE_TABS_LIST } from "constants/page";

const AllPagesList = dynamic<any>(() => import("components/pages").then((a) => a.AllPagesList), {
  ssr: false,
});

const FavoritePagesList = dynamic<any>(() => import("components/pages").then((a) => a.FavoritePagesList), {
  ssr: false,
});

const PrivatePagesList = dynamic<any>(() => import("components/pages").then((a) => a.PrivatePagesList), {
  ssr: false,
});

const ArchivedPagesList = dynamic<any>(() => import("components/pages").then((a) => a.ArchivedPagesList), {
  ssr: false,
});

const SharedPagesList = dynamic<any>(() => import("components/pages").then((a) => a.SharedPagesList), {
  ssr: false,
});

const ProjectPagesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  // store
  const {
    page: { fetchPages, fetchArchivedPages },
  } = useMobxStore();
  // hooks
  const {} = useUserAuth();
  // local storage
  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");
  // fetching pages from API
  useSWR(
    workspaceSlug && projectId ? `ALL_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchPages(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching archived pages from API
  useSWR(
    workspaceSlug && projectId ? `ALL_ARCHIVED_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchArchivedPages(workspaceSlug.toString(), projectId.toString()) : null
  );

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "Recent":
        return 0;
      case "All":
        return 1;
      case "Favorites":
        return 2;
      case "Private":
        return 3;
      case "Shared":
        return 4;
      case "Archived":
        return 5;
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
          projectId={projectId.toString()}
        />
      )}
      <div className="flex h-full flex-col space-y-5 overflow-hidden p-6">
        <div className="flex justify-between gap-4">
          <h3 className="text-2xl font-semibold text-custom-text-100">Pages</h3>
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
                return setPageTab("Private");
              case 4:
                return setPageTab("Shared");
              case 5:
                return setPageTab("Archived");
              default:
                return setPageTab("All");
            }
          }}
        >
          <Tab.List as="div" className="mb-6 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
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
            <Tab.Panel as="div" className="h-full space-y-5 overflow-y-auto">
              <RecentPagesList />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <AllPagesList />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <FavoritePagesList />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <PrivatePagesList />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <SharedPagesList />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-hidden">
              <ArchivedPagesList />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
});

ProjectPagesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PagesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectPagesPage;
