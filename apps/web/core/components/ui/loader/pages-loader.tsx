import { range } from "lodash-es";

export function PagesLoader() {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-hidden p-6">
      <div className="flex justify-between gap-4">
        <h3 className="text-20 font-semibold text-primary">Pages</h3>
      </div>
      <div className="flex items-center gap-3">
        {range(5).map((i) => (
          <span key={i} className="h-8 w-20 bg-layer-1 rounded-full" />
        ))}
      </div>
      <div className="divide-y divide-subtle-1">
        {range(5).map((i) => (
          <div key={i} className="h-12 w-full flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 bg-layer-1 rounded-sm" />
              <span className="h-5 w-20 bg-layer-1 rounded-sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-16 bg-layer-1 rounded-sm" />
              <span className="h-5 w-5 bg-layer-1 rounded-sm" />
              <span className="h-5 w-5 bg-layer-1 rounded-sm" />
              <span className="h-5 w-5 bg-layer-1 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
