// lucide icons
import { Circle } from "lucide-react";

export const KanBanProperties = () => {
  console.log("properties");
  return (
    <div className="relative flex gap-2 overflow-hidden overflow-x-auto whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">state</div>
      </div>

      {/* priority */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">priority</div>
      </div>

      {/* label */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">label</div>
      </div>

      {/* assignee */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">assignee</div>
      </div>

      {/* start date */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">start date</div>
      </div>

      {/* target/due date */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">target/due date</div>
      </div>

      {/* extra render properties */}
      {/* estimate */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">0</div>
      </div>

      {/* sub-issues */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">0</div>
      </div>

      {/* attachments */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">0</div>
      </div>

      {/* link */}
      <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
        <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
          <Circle width={10} strokeWidth={2} />
        </div>
        <div className="pl-0.5 pr-1 text-xs">0</div>
      </div>
    </div>
  );
};
