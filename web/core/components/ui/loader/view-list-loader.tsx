import range from "lodash/range";

export const ViewListLoader = () => (
  <div className="flex h-full w-full flex-col animate-pulse">
    {range(8).map((i) => (
      <div key={i} className="group border-b border-custom-border-200">
        <div className="relative flex w-full items-center justify-between rounded p-4">
          <div className="flex items-center gap-4">
            <span className="min-h-10 min-w-10 bg-custom-background-80 rounded" />
            <span className="h-6 w-28 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
