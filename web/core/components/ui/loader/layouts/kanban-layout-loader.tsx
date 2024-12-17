import { forwardRef } from "react";
import range from "lodash/range";
import { cn } from "@plane/editor";
import { ContentWrapper } from "@plane/ui";

export const KanbanIssueBlockLoader = forwardRef<HTMLSpanElement, { cardHeight?: number; shouldAnimate?: boolean }>(
  ({ cardHeight = 100, shouldAnimate = true }, ref) => (
    <span
      ref={ref}
      className={cn(`block bg-custom-background-80 rounded`, { " animate-pulse": shouldAnimate })}
      style={{ height: `${cardHeight}px` }}
    />
  )
);

export const KanbanColumnLoader = ({
  cardsInColumn = 3,
  ignoreHeader = false,
  cardHeight = 100,
  shouldAnimate = true,
}: {
  cardsInColumn?: number;
  ignoreHeader?: boolean;
  cardHeight?: number;
  shouldAnimate?: boolean;
}) => (
  <div className="flex flex-col gap-3">
    {!ignoreHeader && (
      <div className="flex items-center justify-between h-9 w-80">
        <div className="flex item-center gap-3">
          <span className={cn("h-6 w-6 bg-custom-background-80 rounded", { " animate-pulse": shouldAnimate })} />
          <span className={cn("h-6 w-24 bg-custom-background-80 rounded", { " animate-pulse": shouldAnimate })} />
        </div>
      </div>
    )}
    {range(cardsInColumn).map((cardIndex) => (
      <KanbanIssueBlockLoader key={cardIndex} cardHeight={cardHeight} shouldAnimate={shouldAnimate} />
    ))}
  </div>
);

KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export const KanbanLayoutLoader = ({ cardsInEachColumn = [2, 3, 2, 4, 3] }: { cardsInEachColumn?: number[] }) => (
  <ContentWrapper className="flex-row gap-5 py-1.5 overflow-x-auto">
    {cardsInEachColumn.map((cardsInColumn, columnIndex) => (
      <KanbanColumnLoader key={columnIndex} cardsInColumn={cardsInColumn} />
    ))}
  </ContentWrapper>
);
