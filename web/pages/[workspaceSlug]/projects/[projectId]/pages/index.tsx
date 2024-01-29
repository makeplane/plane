import { useState, Fragment, ReactElement } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Tab } from "@headlessui/react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useUser } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { RecentPagesList, CreateUpdatePageModal } from "components/pages";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
import { PagesHeader } from "components/headers";
import { Spinner } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { PAGE_TABS_LIST } from "constants/page";
import { useProjectPages } from "hooks/store/use-project-page";
import { EUserWorkspaceRoles } from "constants/workspace";

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
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    currentUser,
    currentUserLoader,
    membership: { currentProjectRole },
  } = useUser();
  const {
    commandPalette: { toggleCreatePageModal },
  } = useApplication();

  const { fetchProjectPages, fetchArchivedProjectPages, loader, archivedPageLoader, projectPageIds, archivedPageIds } =
    useProjectPages();
  // hooks
  const {} = useUserAuth({ user: currentUser, isLoading: currentUserLoader });
  // local storage
  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");
  // fetching pages from API
  useSWR(
    workspaceSlug && projectId ? `ALL_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectPages(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching archived pages from API
  useSWR(
    workspaceSlug && projectId ? `ALL_ARCHIVED_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchArchivedProjectPages(workspaceSlug.toString(), projectId.toString()) : null
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

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "pages", isLightMode);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  if (loader || archivedPageLoader)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );

  return (
    <>
      {projectPageIds && archivedPageIds && projectPageIds.length + archivedPageIds.length > 0 ? (
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
      ) : (
        <EmptyState
          image={EmptyStateImagePath}
          title="Write a note, a doc, or a full knowledge base. Get Galileo, Plane’s AI assistant, to help you get started"
          description="Pages are thoughts potting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. To make short work of any doc, invoke Galileo, Plane’s AI, with a shortcut or the click of a button."
          primaryButton={{
            text: "Create your first page",
            onClick: () => toggleCreatePageModal(true),
          }}
          comicBox={{
            title: "A page can be a doc or a doc of docs.",
            description:
              "We wrote Nikhil and Meera’s love story. You could write your project’s mission, goals, and eventual vision.",
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
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
