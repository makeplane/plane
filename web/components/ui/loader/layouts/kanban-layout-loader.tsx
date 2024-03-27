import { forwardRef } from "react";

export const KanbanIssueBlockLoader = forwardRef<HTMLSpanElement>((props, ref) => (
  <span ref={ref} className="block h-28 m-1.5 animate-pulse bg-custom-background-80 rounded" />
));

KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export const KanbanLayoutLoader = ({ cardsInEachColumn = [2, 3, 2, 4, 3] }: { cardsInEachColumn?: number[] }) => (
  <div className="flex gap-5 px-3.5 py-1.5 overflow-x-auto">
    {cardsInEachColumn.map((cardsInColumn, columnIndex) => (
      <div key={columnIndex} className="flex flex-col gap-3">
        <div className="flex items-center justify-between h-9 w-80">
          <div className="flex item-center">
            <span className="h-6 w-6 bg-custom-background-80 rounded animate-pulse" />
            <span className="h-6 w-24 bg-custom-background-80 rounded animate-pulse" />
          </div>
          <span className="h-6 w-6 bg-custom-background-80 rounded animate-pulse" />
        </div>
        {Array.from({ length: cardsInColumn }, (_, cardIndex) => (
          <KanbanIssueBlockLoader key={cardIndex} />
        ))}
      </div>
    ))}
  </div>
);
