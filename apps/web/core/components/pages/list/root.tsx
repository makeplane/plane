import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import type { TPageNavigationTabs } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ListLayout } from "@/components/core/list";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// local imports
import { PageListBlock } from "./block";
import { PageListLoader } from "./loader";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getCurrentProjectFilteredPageIdsByTab, fetchPagesList, getPaginationInfo, getPaginationLoader } =
    usePageStore(storeType);

  // pagination hooks
  const paginationInfo = getPaginationInfo(pageType);
  const paginationLoader = getPaginationLoader(pageType);
  const hasNextPage = paginationInfo.hasNextPage;
  const isFetchingNextPage = paginationLoader === "pagination";

  // state for intersection observer element
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  // ref for container - we'll wrap ListLayout
  const containerRef = useRef<HTMLDivElement | null>(null);

  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);

  // Function to fetch next page
  const fetchNextPage = useCallback(() => {
    if (!workspaceSlug || !projectId || !hasNextPage || isFetchingNextPage) {
      return;
    }
    // Use fetchPagesList with cursor from pagination info
    void fetchPagesList(
      workspaceSlug.toString(),
      projectId.toString(),
      pageType,
      paginationInfo.nextCursor ?? undefined
    );
  }, [workspaceSlug, projectId, hasNextPage, isFetchingNextPage, fetchPagesList, pageType, paginationInfo.nextCursor]);

  // Set up intersection observer to trigger loading more pages
  useIntersectionObserver(
    containerRef,
    isFetchingNextPage ? null : intersectionElement,
    fetchNextPage,
    `100% 0% 100% 0%`
  );

  if (!filteredPageIds) return <></>;

  return (
    <div ref={containerRef} className="size-full">
      <ListLayout>
        {filteredPageIds.map((pageId) => (
          <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
        ))}
        {hasNextPage && <div ref={setIntersectionElement}>{isFetchingNextPage && <PageListLoader />}</div>}
      </ListLayout>
    </div>
  );
});
