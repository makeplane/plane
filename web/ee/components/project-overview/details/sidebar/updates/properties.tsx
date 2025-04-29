import { Rocket } from "lucide-react";
import { cn } from "@plane/utils";

type TProps = {
  isCollapsed: boolean;
};
export const Properties = (props: TProps) => {
  const { isCollapsed } = props;
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-custom-border-100" : "max-h-0"
      )}
    >
      <div className="my-4">
        {/* Properties */}
        <div>
          <div className="flex">
            <div className="text-xs font-medium text-custom-text-350 w-3/6 my-auto">State</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-custom-text-300 my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>

          <div className="flex">
            <div className="text-xs font-medium text-custom-text-350 w-3/6 my-auto">Priority</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-custom-text-300 my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>

          <div className="flex">
            <div className="text-xs font-medium text-custom-text-350 w-3/6 my-auto">{"Start -> End date"}</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-custom-text-300 my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
