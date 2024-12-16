import { Rocket } from "lucide-react";
import { cn } from "@plane/editor";

type TProps = {
  isCollapsed: boolean;
};
export const Properties = (props: TProps) => {
  const { isCollapsed } = props;
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-custom-border-80" : "max-h-0"
      )}
    >
      <div className="my-4">
        {/* Progress */}
        <div className="text-xs text-custom-text-350 ">Since last update</div>
        <div className="flex text-custom-text-300 text-xs gap-4 mb-3">
          <div className="flex font-medium mr-2">
            <Rocket size={12} className="my-auto mr-1" />
            <span>Progress 13%</span>{" "}
          </div>
          <div>20 / 150 done</div>
        </div>

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
