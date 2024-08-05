"use client";

import { FC } from "react";
import { Loader, Plus } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";

type TIssueWorklogPropertyButton = { content?: string; placeHolder?: string; disabled?: boolean; isLoading?: boolean };

export const IssueWorklogPropertyButton: FC<TIssueWorklogPropertyButton> = (props) => {
  const { content, placeHolder, disabled, isLoading } = props;

  return (
    <div
      className={cn("flex justify-between items-center text-sm cursor-pointer p-2 rounded transition-all", {
        "bg-custom-background-90 cursor-not-allowed": disabled,
        "group hover:bg-custom-background-80": !disabled,
      })}
    >
      <div
        className={cn({
          "text-custom-text-400": !content,
        })}
      >
        {(content || "").length > 0 ? content : placeHolder ? placeHolder : "Add time tracking"}
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
