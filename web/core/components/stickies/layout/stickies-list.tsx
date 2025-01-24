import { useEffect, useRef, useState } from "react";
import type {
  DropTargetRecord,
  DragLocationHistory,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import type { ElementDragPayload } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import Masonry from "react-masonry-component";
// components
import { EmptyState } from "@/components/empty-state";
import { StickiesEmptyState } from "@/components/home/widgets/empty-states/stickies";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useSticky } from "@/hooks/use-stickies";
import { useStickyOperations } from "../sticky/use-operations";
import { StickiesLoader } from "./stickies-loader";
import { StickyDNDWrapper } from "./sticky-dnd-wrapper";
import { getInstructionFromPayload } from "./sticky.helpers";

type TStickiesLayout = {
  workspaceSlug: string;
  intersectionElement?: React.ReactNode | null;
};

type TProps = TStickiesLayout & {
  columnCount: number;
};

export const StickiesList = observer((props: TProps) => {
  const { workspaceSlug, intersectionElement, columnCount } = props;
  // navigation
  const pathname = usePathname();
  // store hooks
  const { getWorkspaceStickyIds, toggleShowNewSticky, searchQuery, loader } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });
  // derived values
  const workspaceStickyIds = getWorkspaceStickyIds(workspaceSlug?.toString());
  const itemWidth = `${100 / columnCount}%`;
  const totalRows = Math.ceil(workspaceStickyIds.length / columnCount);
  const isStickiesPage = pathname?.includes("stickies");
  const masonryRef = useRef<any>(null);

  const handleLayout = () => {
    if (masonryRef.current) {
      // Force reflow
      masonryRef.current.performLayout();
    }
  };

  // Function to determine if an item is in first or last row
  const getRowPositions = (index: number) => {
    const currentRow = Math.floor(index / columnCount);
    return {
      isInFirstRow: currentRow === 0,
      isInLastRow: currentRow === totalRows - 1 || index >= workspaceStickyIds.length - columnCount,
    };
  };

  const handleDrop = (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => {
    const dropTargets = location?.current?.dropTargets ?? [];
    if (!dropTargets || dropTargets.length <= 0) return;

    const dropTarget = dropTargets[0];
    if (!dropTarget?.data?.id || !source.data?.id) return;

    const instruction = getInstructionFromPayload(dropTarget, source, location);
    const droppedId = dropTarget.data.id;
    const sourceId = source.data.id;

    try {
      if (!instruction || !droppedId || !sourceId) return;
      stickyOperations.updatePosition(workspaceSlug, sourceId as string, droppedId as string, instruction);
    } catch (error) {
      console.error("Error reordering sticky:", error);
    }
  };

  if (loader === "init-loader") {
    return <StickiesLoader />;
  }

  if (loader === "loaded" && workspaceStickyIds.length === 0) {
    return (
      <div className="size-full grid place-items-center px-2">
        {isStickiesPage || searchQuery ? (
          <EmptyState
            type={searchQuery ? EmptyStateType.STICKIES_SEARCH : EmptyStateType.STICKIES}
            layout={searchQuery ? "screen-simple" : "screen-detailed"}
            primaryButtonOnClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
            }}
            primaryButtonConfig={{
              size: "sm",
            }}
          />
        ) : (
          <StickiesEmptyState />
        )}
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* @ts-expect-error type mismatch here */}
      <Masonry elementType="div" ref={masonryRef}>
        {workspaceStickyIds.map((stickyId, index) => {
          const { isInFirstRow, isInLastRow } = getRowPositions(index);
          return (
            <StickyDNDWrapper
              key={stickyId}
              stickyId={stickyId}
              workspaceSlug={workspaceSlug.toString()}
              itemWidth={itemWidth}
              handleDrop={handleDrop}
              isLastChild={index === workspaceStickyIds.length - 1}
              isInFirstRow={isInFirstRow}
              isInLastRow={isInLastRow}
              handleLayout={handleLayout}
            />
          );
        })}
        {intersectionElement && <div style={{ width: itemWidth }}>{intersectionElement}</div>}
      </Masonry>
    </div>
  );
});

export const StickiesLayout = (props: TStickiesLayout) => {
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
    <div ref={ref} className="size-full min-h-[500px]">
      <StickiesList {...props} columnCount={columnCount} />
    </div>
  );
};
