"use client";

import { FC } from "react";
import { Loader, Plus } from "lucide-react";
// helpers
import { cn  } from "@plane/utils";

type TIssueWorklogPropertyButton = { content?: string; isLoading?: boolean };

export const IssueWorklogPropertyButton: FC<TIssueWorklogPropertyButton> = (props) => {
  const { content, isLoading } = props;

  return (
    <div className="flex justify-between items-center text-sm p-2 rounded transition-all cursor-not-allowed w-full">
      <div
        className={cn({
          "text-custom-text-300": !content,
        })}
      >
        {(content || "").length > 0 ? content : "0h 0m"}
      </div>
      {isLoading ? (
        <div className="transition-all flex-shrink-0 w-4 h-4 flex justify-center items-center text-custom-text-400 animate-spin">
          <Loader size={14} />
        </div>
      ) : (
        <div className="transition-all flex-shrink-0 w-4 h-4 hidden group-hover:flex justify-center items-center text-custom-text-400">
          <Plus size={14} />
        </div>
      )}
    </div>
  );
};
