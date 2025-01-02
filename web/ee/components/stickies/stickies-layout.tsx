import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Masonry from "react-masonry-component";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSticky } from "@/plane-web/hooks/use-stickies";
import { StickyNote } from "./sticky";

const PER_PAGE = 10;

export const StickiesLayout = observer(() => {
  const { workspaceSlug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const {
    fetchingWorkspaceStickies,
    toggleShowNewSticky,
    getWorkspaceStickies,
    fetchWorkspaceStickies,

    currentPage,
    totalPages,
    incrementPage,
  } = useSticky();

  const workspaceStickies = getWorkspaceStickies(workspaceSlug?.toString());

  const handleLoadMore = () => {
    incrementPage();
  };

  useSWR(
    workspaceSlug ? `WORKSPACE_STICKIES_${workspaceSlug}_${PER_PAGE}:${currentPage}:0` : null,
    workspaceSlug
      ? () => fetchWorkspaceStickies(workspaceSlug.toString(), `${PER_PAGE}:${currentPage}:0`, PER_PAGE)
      : null
  );

  useEffect(() => {
    if (!fetchingWorkspaceStickies && workspaceStickies.length === 0) {
      toggleShowNewSticky(true);
    }
  }, [fetchingWorkspaceStickies, workspaceStickies, toggleShowNewSticky]);

  // Always call the intersection observer
  useIntersectionObserver(containerRef, fetchingWorkspaceStickies ? null : intersectionElement, handleLoadMore, "20%");

  if (fetchingWorkspaceStickies && workspaceStickies.length === 0) {
    return (
      <div className="min-h-[500px] overflow-scroll pb-2">
        <Loader>
          <Loader.Item height="300px" width="255px" />
        </Loader>
      </div>
    );
  }

  const getStickiesToRender = () => {
    let stickies: (string | undefined)[] = workspaceStickies;
    if (currentPage + 1 < totalPages && stickies.length >= PER_PAGE) {
      stickies = [...stickies, undefined];
    }
    return stickies;
  };

  const stickyIds = getStickiesToRender();

  const childElements = stickyIds.map((stickyId, index) => (
    <div key={stickyId} className="flex w-[25%] min-h-[300px] p-2">
      {index === stickyIds.length - 1 && currentPage + 1 < totalPages ? (
        <div ref={setIntersectionElement} className="flex w-full rounded min-h-[300px]">
          <Loader className="w-full h-full">
            <Loader.Item height="100%" width="100%" />
          </Loader>
        </div>
      ) : (
        <StickyNote key={stickyId || "new"} workspaceSlug={workspaceSlug.toString()} stickyId={stickyId} />
      )}
    </div>
  ));
  return (
    <div ref={containerRef} className="h-[500px] overflow-scroll pb-2">
      <div className="h-full w-full">
        {/* TODO: types not configured properly for this package, fix later */}
        {/* @ts-expect-error */}
        <Masonry elementType="div">{childElements}</Masonry>
      </div>
    </div>
  );
});
