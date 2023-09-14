// lucide icons
import { Plus } from "lucide-react";

export const IssueHeader = () => (
  <div className="relative flex items-center w-full h-full gap-1">
    {/* default layout */}
    <div className=" border border-red-500 flex-shrink-0 w-[24px] h-[24px] flex justify-center items-center">
      I
    </div>
    <div className=" border border-red-500 line-clamp-1 font-medium">Kanban Issue Heading</div>
    <div className=" border border-red-500 flex-shrink-0 w-[24px] h-[24px] flex justify-center items-center">
      0
    </div>

    <div className=" border border-red-500 ml-auto flex-shrink-0 w-[24px] h-[24px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-gray-100 transition-all">
      M
    </div>
    <div className=" border border-red-500 flex-shrink-0 w-[24px] h-[24px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-gray-100 transition-all text-blue-800">
      <Plus size={16} strokeWidth={2} />
    </div>
  </div>
);
