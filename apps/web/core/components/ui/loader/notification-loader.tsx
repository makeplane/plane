import range from "lodash/range";

export const NotificationsLoader = () => (
  <div className="divide-y divide-custom-border-100 animate-pulse overflow-hidden">
    {range(3).map((i) => (
      <div key={i} className="flex w-full items-center gap-4 p-3">
        <span className="min-h-12 min-w-12 bg-custom-background-80 rounded-full" />
        <div className="flex flex-col gap-2.5 w-full">
          <span className="h-5 w-36 bg-custom-background-80 rounded" />
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="h-5 w-28 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
