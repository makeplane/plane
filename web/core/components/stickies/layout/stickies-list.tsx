import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import Masonry from "react-masonry-component";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useSticky } from "@/hooks/use-stickies";
import { STICKY_COLORS } from "../../editor/sticky-editor/color-pallete";
import { EmptyState } from "../empty";
import { StickyNote } from "../sticky";
import { useStickyOperations } from "../sticky/use-operations";

type TStickiesLayout = {
  workspaceSlug: string;
  intersectionElement?: React.ReactNode | null;
};

type TProps = TStickiesLayout & {
  columnCount: number;
};

export const StickiesList = observer((props: TProps) => {
  const { workspaceSlug, intersectionElement, columnCount } = props;
  // hooks
  const { getWorkspaceStickies, toggleShowNewSticky, creatingSticky, searchQuery, loader } = useSticky();
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  //derived values
  const workspaceStickies = getWorkspaceStickies(workspaceSlug?.toString());
  const itemWidth = `${100 / columnCount}%`;

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
          stickyOperations.create({ color: STICKY_COLORS[0] });
        }}
      />
    );

  return (
    <>
      {/* @ts-expect-error type mismatch here */}
      <Masonry elementType="div">
        {workspaceStickies.map((stickyId) => (
          <div key={stickyId} className={cn("flex min-h-[300px] box-border p-2")} style={{ width: itemWidth }}>
            <StickyNote key={stickyId || "new"} workspaceSlug={workspaceSlug.toString()} stickyId={stickyId} />
          </div>
        ))}
        {intersectionElement && <div style={{ width: itemWidth }}>{intersectionElement}</div>}
      </Masonry>
    </>
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
    <div ref={ref}>
      <StickiesList {...props} columnCount={columnCount} />
    </div>
  );
};
