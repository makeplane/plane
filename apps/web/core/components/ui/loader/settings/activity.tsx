import { range } from "lodash-es";
import { getRandomLength } from "../utils";

export function ActivitySettingsLoader() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {range(10).map((i) => (
        <div key={i} className="relative flex items-center gap-2 h-12 border-b border-subtle">
          <span className="h-6 w-6 bg-layer-1 rounded-sm" />
          <span className={`h-6 w-${getRandomLength(["52", "72", "96"])} bg-layer-1 rounded-sm`} />
        </div>
      ))}
    </div>
  );
}
