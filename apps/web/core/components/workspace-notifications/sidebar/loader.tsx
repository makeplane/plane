import { range } from "lodash-es";

export function NotificationsLoader() {
  return (
    <div className="divide-y divide-subtle animate-pulse overflow-hidden">
      {range(8).map((i) => (
        <div key={i} className="flex w-full items-center gap-4 p-3">
          <span className="min-h-12 min-w-12 bg-layer-1 rounded-full" />
          <div className="flex flex-col gap-2.5 w-full">
            <span className="h-5 w-36 bg-layer-1 rounded-xs" />
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="h-5 w-28 bg-layer-1 rounded-xs" />
              <span className="h-5 w-16 bg-layer-1 rounded-xs" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
