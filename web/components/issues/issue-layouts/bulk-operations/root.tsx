import { observer } from "mobx-react";
import { Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, Tooltip } from "@plane/ui";
// components
import { IssueBulkOperationsProperties } from "@/components/issues";

export const IssueBulkOperationsRoot: React.FC<any> = observer((props) => {
  const {} = props;

  return (
    <div className="h-full w-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-custom-border-200 text-custom-text-300">
      <div className="h-7 pr-3 text-sm flex items-center">2 selected</div>
      <div className="h-7 px-3 flex items-center">
        <Tooltip tooltipContent="Archive">
          <button type="button" className="outline-none grid place-items-center">
            <ArchiveIcon className="size-4" />
          </button>
        </Tooltip>
      </div>
      <div className="h-7 px-3 flex items-center">
        <Tooltip tooltipContent="Delete">
          <button type="button" className="outline-none grid place-items-center">
            <Trash2 className="size-4" />
          </button>
        </Tooltip>
      </div>
      <div className="h-7 pl-3 flex items-center gap-3">
        <IssueBulkOperationsProperties />
      </div>
    </div>
  );
});
