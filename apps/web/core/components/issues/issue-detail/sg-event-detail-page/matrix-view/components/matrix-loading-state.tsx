import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

type MatrixLoadingStateProps = {
  className?: string;
  columnCount?: number;
  rowCount?: number;
};

export const MatrixLoadingState = ({ className, columnCount = 8, rowCount = 5 }: MatrixLoadingStateProps) => (
  <Loader
    className={cn(
      "vertical-scrollbar horizontal-scrollbar scrollbar-lg max-h-[520px] min-h-52 w-full overflow-auto",
      className
    )}
  >
    <span className="sr-only">Loading matrix data</span>
    <div className="min-w-max" aria-hidden="true">
      <div className="sticky top-0 z-10 flex h-24 border-b border-custom-border-200 bg-custom-background-90">
        <div className="sticky left-0 z-20 flex w-56 flex-shrink-0 items-center border-r border-custom-border-200 bg-custom-background-90 px-4">
          <Loader.Item className="h-3 w-24" />
        </div>
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div
            key={`matrix-loading-header-${columnIndex}`}
            className="flex w-20 flex-shrink-0 items-center justify-center border-r border-custom-border-200 px-2"
          >
            <Loader.Item className="h-10 w-3" />
          </div>
        ))}
      </div>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div key={`matrix-loading-row-${rowIndex}`} className="flex h-11 border-b border-custom-border-200">
          <div className="sticky left-0 z-[1] flex w-56 flex-shrink-0 items-center border-r border-custom-border-200 bg-custom-background-100 px-4">
            <Loader.Item className="h-3 w-32" />
          </div>
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <div
              key={`matrix-loading-cell-${rowIndex}-${columnIndex}`}
              className="flex w-20 flex-shrink-0 items-center justify-center border-r border-custom-border-100 px-2"
            >
              <Loader.Item className="h-3 w-5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </Loader>
);
