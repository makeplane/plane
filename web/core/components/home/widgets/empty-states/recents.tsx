import { History } from "lucide-react";

export const RecentsEmptyState = () => (
  <div className="h-[200px] flex w-full justify-center py-6 border-[1.5px] border-custom-border-100 rounded">
    <div className="m-auto">
      <div
        className={`mb-2 rounded-full mx-auto last:rounded-full w-[50px] h-[50px] flex items-center justify-center bg-custom-background-80/40 transition-transform duration-300`}
      >
        <History size={30} className="text-custom-text-400 -rotate-45" />
      </div>
      <div className="text-custom-text-100 font-medium text-base text-center mb-1">No recent items yet</div>
      <div className="text-custom-text-300 text-sm text-center mb-2">You don’t have any recent items yet. </div>
    </div>
  </div>
);
