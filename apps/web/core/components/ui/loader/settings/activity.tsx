import { range } from "lodash-es";
import { getRandomLength } from "../utils";

export function ActivitySettingsLoader() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      {range(10).map((i) => (
        <div key={i} className="relative flex h-12 items-center gap-2 border-b border-subtle">
          <span className="h-6 w-6 rounded-sm bg-layer-1" />
          <span className={`h-6 w-${getRandomLength(["52", "72", "96"])} rounded-sm bg-layer-1`} />
        </div>
      ))}
    </div>
  );
}
