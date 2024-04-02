import { FC } from "react";
import { useRouter } from "next/router";
// hooks
import { Loader } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { EMPTY_STATE_DETAILS, EmptyStateType } from "@/constants/empty-state";
import { useApplication } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
// components
import { PagesListItem } from "./list-item";
// ui
// constants

type IPagesListView = {
  pageIds: string[];
};

export const PagesListView: FC<IPagesListView> = (props) => {
  const { pageIds: projectPageIds } = props;
  // store hooks
  const {
    commandPalette: { toggleCreatePageModal },
  } = useApplication();
  // local storage
  const { storedValue: pageTab } = useLocalStorage("pageTab", "Recent");
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // here we are only observing the projectPageStore, so that we can re-render the component when the projectPageStore changes

  const emptyStateType = pageTab ? `project-page-${pageTab.toLowerCase()}` : EmptyStateType.PROJECT_PAGE_ALL;
  const isButtonVisible = pageTab !== "archived" && pageTab !== "favorites";

  return (
    <>
      {projectPageIds && workspaceSlug && projectId ? (
        <div className="h-full space-y-4 overflow-y-auto vertical-scrollbar scrollbar-lg">
          {projectPageIds.length > 0 ? (
            <ul role="list" className="divide-y divide-custom-border-200">
              {projectPageIds.map((pageId: string) => (
                <PagesListItem key={pageId} pageId={pageId} projectId={projectId.toString()} />
              ))}
            </ul>
          ) : (
            <EmptyState
              type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS}
              primaryButtonOnClick={isButtonVisible ? () => toggleCreatePageModal(true) : undefined}
            />
          )}
        </div>
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
};
