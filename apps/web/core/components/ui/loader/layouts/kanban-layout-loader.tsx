import { forwardRef } from "react";
import { range } from "lodash-es";
// plane ui
import { ContentWrapper } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";

export const KanbanIssueBlockLoader = forwardRef(function KanbanIssueBlockLoader(
  { cardHeight = 100, shouldAnimate = true }: { cardHeight?: number; shouldAnimate?: boolean },
  ref: React.ForwardedRef<HTMLSpanElement>
) {
  return (
    <span
      ref={ref}
      className={cn(`block bg-layer-1 rounded-sm`, { " animate-pulse": shouldAnimate })}
      style={{ height: `${cardHeight}px` }}
    />
  );
});

export function KanbanColumnLoader({
  cardsInColumn = 3,
  ignoreHeader = false,
  cardHeight = 100,
  shouldAnimate = true,
}: {
  cardsInColumn?: number;
  ignoreHeader?: boolean;
  cardHeight?: number;
  shouldAnimate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {!ignoreHeader && (
        <div className="flex items-center justify-between h-9 w-80">
          <div className="flex item-center gap-3">
            <span className={cn("h-6 w-6 bg-layer-1 rounded-sm", { " animate-pulse": shouldAnimate })} />
            <span className={cn("h-6 w-24 bg-layer-1 rounded-sm", { " animate-pulse": shouldAnimate })} />
          </div>
        </div>
      )}
      {range(cardsInColumn).map((cardIndex) => (
        <KanbanIssueBlockLoader key={cardIndex} cardHeight={cardHeight} shouldAnimate={shouldAnimate} />
      ))}
    </div>
  );
}

KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export function KanbanLayoutLoader({ cardsInEachColumn = [2, 3, 2, 4, 3] }: { cardsInEachColumn?: number[] }) {
  return (
    <ContentWrapper className="flex-row gap-5 py-1.5 overflow-x-auto">
      {cardsInEachColumn.map((cardsInColumn, columnIndex) => (
        <KanbanColumnLoader key={columnIndex} cardsInColumn={cardsInColumn} />
      ))}
    </ContentWrapper>
  );
}
