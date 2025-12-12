import { range } from "lodash-es";

export function MembersSettingsLoader() {
  return (
    <div className="divide-y-[0.5px] divide-subtle">
      {range(3).map((i) => (
        <div key={i} className="group grid grid-cols-5 items-center justify-evenly px-3 py-4">
          <div className="flex col-span-2 items-center gap-x-2.5">
            <span className="size-6 bg-layer-1 rounded-full" />
            <span className="h-5 w-24 bg-layer-1 rounded-sm" />
          </div>
          <span className="h-5 w-24 bg-layer-1 rounded-sm" />
          <span className="h-5 w-20 bg-layer-1 rounded-sm" />
          <span className="h-5 w-28 bg-layer-1 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
