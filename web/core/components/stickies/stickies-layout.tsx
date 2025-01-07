import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Masonry from "react-masonry-component";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSticky } from "@/hooks/use-stickies";
import { STICKY_COLORS } from "../editor/sticky-editor/color-pallete";
import { EmptyState } from "./empty";
import { StickyNote } from "./sticky";
import { useStickyOperations } from "./sticky/use-operations";

const PER_PAGE = 10;

type TProps = {
  columnCount: number;
};

export const StickyAll = observer((props: TProps) => {
  const { columnCount } = props;
  // refs
  const masonryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // states
  const [containerHeight, setContainerHeight] = useState(0);
  const [showAllStickies, setShowAllStickies] = useState(false);
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  const {
    fetchingWorkspaceStickies,
    toggleShowNewSticky,
    getWorkspaceStickies,
    fetchWorkspaceStickies,
    currentPage,
    totalPages,
    incrementPage,
    creatingSticky,
  } = useSticky();

  const workspaceStickies = getWorkspaceStickies(workspaceSlug?.toString());
  const itemWidth = `${100 / columnCount}%`;

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

  // Update this useEffect to correctly track height
  useEffect(() => {
    if (!masonryRef?.current) return;

    const updateHeight = () => {
      if (masonryRef.current) {
        const height = masonryRef.current.getBoundingClientRect().height;
        setContainerHeight(parseInt(height.toString()));
      }
    };

    // Initial height measurement
    updateHeight();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(masonryRef.current);

    // Also update height when Masonry content changes
    const mutationObserver = new MutationObserver(() => {
      updateHeight();
    });

    mutationObserver.observe(masonryRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [masonryRef?.current]);

  useIntersectionObserver(containerRef, fetchingWorkspaceStickies ? null : intersectionElement, incrementPage, "20%");

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
    <div key={stickyId} className={cn("flex min-h-[300px] box-border p-2")} style={{ width: itemWidth }}>
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

  if (!fetchingWorkspaceStickies && workspaceStickies.length === 0)
    return (
      <EmptyState
        creatingSticky={creatingSticky}
        handleCreate={() => {
          toggleShowNewSticky(true);
          stickyOperations.create({ color: STICKY_COLORS[0] });
        }}
      />
    );

  return (
    <div
      ref={containerRef}
      className={cn("relative max-h-[625px] overflow-hidden pb-2 box-border", {
        "max-h-full overflow-scroll": showAllStickies,
      })}
    >
      <div className="h-full w-full" ref={masonryRef}>
        {/* @ts-expect-error type mismatch here */}
        <Masonry elementType="div">{childElements}</Masonry>
      </div>
      {containerHeight > 632.9 && (
        <div className="absolute bottom-0 left-0 bg-gradient-to-t from-custom-background-100 to-transparent w-full h-[100px] text-center text-sm font-medium text-custom-primary-100">
          <button
            className="flex flex-col items-center justify-end gap-1 h-full m-auto w-full"
            onClick={() => setShowAllStickies((state) => !state)}
          >
            {showAllStickies ? "Show less" : "Show all"}
          </button>
        </div>
      )}
    </div>
  );
});

export const StickiesLayout = () => {
  // states
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref?.current) return;

    setContainerWidth(ref?.current.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(ref?.current);
    return () => resizeObserver.disconnect();
  }, []);

  const getColumnCount = (width: number | null): number => {
    if (width === null) return 4;

    if (width < 640) return 2; // sm
    if (width < 768) return 3; // md
    if (width < 1024) return 4; // lg
    if (width < 1280) return 5; // xl
    return 6; // 2xl and above
  };

  const columnCount = getColumnCount(containerWidth);
  return (
    <div ref={ref}>
      <StickyAll columnCount={columnCount} />
    </div>
  );
};
