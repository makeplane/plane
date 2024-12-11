import range from "lodash/range";
import { getRandomLength } from "../utils";

export const ActivitySettingsLoader = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    {range(10).map((i) => (
      <div key={i} className="relative flex items-center gap-2 h-12 border-b border-custom-border-200">
        <span className="h-6 w-6 bg-custom-background-80 rounded" />
        <span className={`h-6 w-${getRandomLength(["52", "72", "96"])} bg-custom-background-80 rounded`} />
      </div>
    ))}
  </div>
);
