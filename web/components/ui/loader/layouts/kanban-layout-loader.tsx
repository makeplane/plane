export const KanbanLayoutLoader = ({ cardsInEachColumn = [2, 3, 2, 4, 3] }: { cardsInEachColumn?: number[] }) => (
  <div className="flex gap-5 px-3.5 py-1.5 overflow-x-auto">
    {cardsInEachColumn.map((cardsInColumn, columnIndex) => (
      <div key={columnIndex} className="flex flex-col gap-3 animate-pulse">
        <div className="flex items-center justify-between h-9 w-80">
          <div className="flex item-center gap-1.5">
            <span className="h-6 w-6 bg-custom-background-80 rounded" />
            <span className="h-6 w-24 bg-custom-background-80 rounded" />
          </div>
          <span className="h-6 w-6 bg-custom-background-80 rounded" />
        </div>
        {Array.from({ length: cardsInColumn }, (_, cardIndex) => (
          <span key={cardIndex} className="h-28 w-80 bg-custom-background-80 rounded" />
        ))}
      </div>
    ))}
  </div>
);
