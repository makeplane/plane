import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { STICKIES_PER_PAGE } from "@plane/constants";
import { ContentWrapper, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSticky } from "@/hooks/use-stickies";
import { StickiesLayout } from "./stickies-list";

export const StickiesInfinite = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { fetchWorkspaceStickies, fetchNextWorkspaceStickies, getWorkspaceStickyIds, loader, paginationInfo } =
    useSticky();
  //state
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // ref
  const containerRef = useRef<HTMLDivElement>(null);

  useSWR(
    workspaceSlug ? `WORKSPACE_STICKIES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStickies(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleLoadMore = () => {
    if (loader === "pagination") return;
    fetchNextWorkspaceStickies(workspaceSlug?.toString());
  };

  const hasNextPage = paginationInfo?.next_page_results && paginationInfo?.next_cursor !== undefined;
  const shouldObserve = hasNextPage && loader !== "pagination";
  const workspaceStickies = getWorkspaceStickyIds(workspaceSlug?.toString());
  useIntersectionObserver(containerRef, shouldObserve ? elementRef : null, handleLoadMore);

  return (
    <ContentWrapper ref={containerRef} className="space-y-4">
      <StickiesLayout
        workspaceSlug={workspaceSlug.toString()}
        intersectionElement={
          hasNextPage &&
          workspaceStickies?.length >= STICKIES_PER_PAGE && (
            <div
              className={cn("flex min-h-[300px] box-border p-2 w-full")}
              ref={setElementRef}
              id="intersection-element"
            >
              <div className="flex w-full rounded min-h-[300px]">
                <Loader className="w-full h-full">
                  <Loader.Item height="100%" width="100%" />
                </Loader>
              </div>
            </div>
          )
        }
      />
    </ContentWrapper>
  );
});
