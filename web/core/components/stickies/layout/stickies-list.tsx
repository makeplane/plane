import { useEffect, useRef, useState } from "react";
import type {
  DropTargetRecord,
  DragLocationHistory,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import type { ElementDragPayload } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import Masonry from "react-masonry-component";
import { Loader } from "@plane/ui";
import { useSticky } from "@/hooks/use-stickies";
import { EmptyState } from "../empty";
import { useStickyOperations } from "../sticky/use-operations";
import { getInstructionFromPayload } from "./sticky.helpers";
import { StickyDNDWrapper } from "./sticky-dnd-wrapper";

type TStickiesLayout = {
  workspaceSlug: string;
  intersectionElement?: React.ReactNode | null;
};

type TProps = TStickiesLayout & {
  columnCount: number;
};

// Updated StickiesList Component
export const StickiesList = observer((props: TProps) => {
  const { workspaceSlug, intersectionElement, columnCount } = props;
  const { getWorkspaceStickies, toggleShowNewSticky, creatingSticky, searchQuery, loader } = useSticky();
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  const workspaceStickies = getWorkspaceStickies(workspaceSlug?.toString());
  const itemWidth = `${100 / columnCount}%`;

  const handleDrop = (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => {
    const dropTargets = location?.current?.dropTargets ?? [];
    if (!dropTargets || dropTargets.length <= 0) return;

    const dropTarget = dropTargets[0]; // Since we don't have nested stickies, we can use the first target
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

  if (loader === "init-loader" || loader === "mutation") {
    return (
      <div className="min-h-[500px] overflow-scroll pb-2">
        <Loader>
          <Loader.Item height="300px" width="255px" />
        </Loader>
      </div>
    );
  }

  if (loader === "loaded" && workspaceStickies.length === 0)
    return (
      <EmptyState
        query={searchQuery}
        creatingSticky={creatingSticky}
        handleCreate={() => {
          toggleShowNewSticky(true);
          stickyOperations.create();
        }}
      />
    );

  return (
    <>
      {/* @ts-expect-error type mismatch here */}
      <Masonry elementType="div">
        {workspaceStickies.map((stickyId, index) => (
          <StickyDNDWrapper
            key={stickyId}
            stickyId={stickyId}
            workspaceSlug={workspaceSlug.toString()}
            itemWidth={itemWidth}
            handleDrop={handleDrop}
            isLastChild={index === workspaceStickies.length - 1}
          />
        ))}
        {intersectionElement && <div style={{ width: itemWidth }}>{intersectionElement}</div>}
      </Masonry>
    </>
  );
});

// StickiesLayout remains the same
export const StickiesLayout = (props: TStickiesLayout) => {
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
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
      <StickiesList {...props} columnCount={columnCount} />
    </div>
  );
};
