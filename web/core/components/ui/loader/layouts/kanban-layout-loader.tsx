import { forwardRef } from "react";

export const KanbanIssueBlockLoader = forwardRef<HTMLSpanElement, { cardHeight?: number }>(
  ({ cardHeight = 100 }, ref) => (
    <span
      ref={ref}
      className={`block m-1.5 animate-pulse bg-custom-background-80 rounded`}
      style={{ height: `${cardHeight}px` }}
    />
  )
);

export const KanbanColumnLoader = ({
  cardsInColumn = 3,
  ignoreHeader = false,
  cardHeight = 100,
}: {
  cardsInColumn?: number;
  ignoreHeader?: boolean;
  cardHeight?: number;
}) => (
  <div className="flex flex-col gap-3">
    {!ignoreHeader && (
      <div className="flex items-center justify-between h-9 w-80">
        <div className="flex item-center gap-3 px-1.5">
          <span className="h-6 w-6 bg-custom-background-80 rounded animate-pulse" />
          <span className="h-6 w-24 bg-custom-background-80 rounded animate-pulse" />
        </div>
      </div>
    )}
    {Array.from({ length: cardsInColumn }, (_, cardIndex) => (
      <KanbanIssueBlockLoader key={cardIndex} cardHeight={cardHeight} />
    ))}
  </div>
);

KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export const KanbanLayoutLoader = ({ cardsInEachColumn = [2, 3, 2, 4, 3] }: { cardsInEachColumn?: number[] }) => (
  <div className="flex gap-5 px-3.5 py-1.5 overflow-x-auto">
    {cardsInEachColumn.map((cardsInColumn, columnIndex) => (
      <KanbanColumnLoader key={columnIndex} cardsInColumn={cardsInColumn} />
    ))}
  </div>
);
