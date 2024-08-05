import { LayersIcon } from "lucide-react";

export const IssueTypePropertiesEmptyState = () => (
  <div className="w-full h-48 px-3 relative flex justify-center items-center">
    <div className="flex flex-col items-center gap-2">
      <div className="flex-shrink-0 grid h-24 w-24 place-items-center rounded-full bg-custom-background-90">
        <LayersIcon className="h-14 w-14 text-custom-text-400" strokeWidth="1.5" />
      </div>
      <div className="text-sm text-custom-text-300">Create new properties for this issue type.</div>
    </div>
  </div>
);
