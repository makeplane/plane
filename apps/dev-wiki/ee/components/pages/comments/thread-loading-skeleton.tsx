import { Filter } from "lucide-react";
import { Loader } from "@plane/ui";

export const PageCommentThreadLoader = () => (
  <div className="w-[361px] h-full bg-custom-background-100 border-l border-custom-border-200 flex flex-col">
    <div className="flex flex-col gap-2 flex-1 p-3">
      {/* Header with title and filter button */}
      <div className="flex justify-between items-start w-full">
        <h2 className="text-custom-text-100 text-base font-medium leading-6">Comments</h2>
        <div className="flex h-6 items-center border border-custom-border-200 rounded">
          <div className="flex h-6 px-2 items-center gap-1">
            <Filter className="w-3 h-3 text-custom-text-300" />
            <span className="text-custom-text-300 text-[11px] font-medium leading-[14px]">Filters</span>
          </div>
        </div>
      </div>

      {/* Comments skeleton loader */}
      <div className="flex-1 space-y-4 overflow-hidden">
        <Loader className="space-y-4">
          {/* Comment Thread 1 */}
          <div className="space-y-3 p-1.5 border-b border-custom-border-200">
            {/* Reference text quote skeleton */}
            <div className="flex gap-1 p-[4px] rounded bg-custom-background-90">
              <Loader.Item width="2px" height="16px" />
              <Loader.Item width="85%" height="12px" />
            </div>

            {/* Main comment */}
            <div className="space-y-2">
              {/* User avatar and timestamp */}
              <div className="flex items-center gap-2">
                <Loader.Item width="24px" height="24px" />
                <Loader.Item width="30%" height="12px" />
              </div>
              {/* Comment content */}
              <Loader.Item width="100%" height="16px" />
              <Loader.Item width="75%" height="16px" />
              <Loader.Item width="40%" height="16px" />
            </div>

            {/* Reply button */}
            <Loader.Item width="15%" height="12px" />
          </div>

          {/* Comment Thread 2 */}
          <div className="space-y-3 p-1.5 border-b border-custom-border-200">
            {/* Main comment */}
            <div className="space-y-2">
              {/* User avatar and timestamp */}
              <div className="flex items-center gap-2">
                <Loader.Item width="24px" height="24px" />
                <Loader.Item width="25%" height="12px" />
              </div>
              {/* Comment content */}
              <Loader.Item width="90%" height="16px" />
              <Loader.Item width="60%" height="16px" />
            </div>

            {/* Show replies button */}
            <Loader.Item width="25%" height="12px" />

            {/* Reply button */}
            <Loader.Item width="15%" height="12px" />
          </div>

          {/* Comment Thread 3 */}
          <div className="space-y-3 p-1.5 border-b border-custom-border-200">
            {/* Main comment */}
            <div className="space-y-2">
              {/* User avatar and timestamp */}
              <div className="flex items-center gap-2">
                <Loader.Item width="24px" height="24px" />
                <Loader.Item width="35%" height="12px" />
              </div>
              {/* Comment content */}
              <Loader.Item width="100%" height="16px" />
              <Loader.Item width="85%" height="16px" />
              <Loader.Item width="50%" height="16px" />
            </div>

            {/* Replies */}
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-2">
                <Loader.Item width="20px" height="20px" />
                <Loader.Item width="25%" height="12px" />
              </div>
              <Loader.Item width="70%" height="14px" />
              <Loader.Item width="45%" height="14px" />
            </div>

            {/* Reply button */}
            <Loader.Item width="15%" height="12px" />
          </div>

          {/* Comment Thread 4 (shorter) */}
          <div className="space-y-3 p-1.5">
            {/* Main comment */}
            <div className="space-y-2">
              {/* User avatar and timestamp */}
              <div className="flex items-center gap-2">
                <Loader.Item width="24px" height="24px" />
                <Loader.Item width="28%" height="12px" />
              </div>
              {/* Comment content */}
              <Loader.Item width="65%" height="16px" />
            </div>

            {/* Reply button */}
            <Loader.Item width="15%" height="12px" />
          </div>
        </Loader>
      </div>
    </div>
  </div>
);
