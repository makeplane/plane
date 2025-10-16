import React from "react";
import { ArrowUp, Paperclip } from "lucide-react";
// constants
import type { ToolbarMenuItem } from "@/constants/editor";
import { IMAGE_ITEM } from "@/constants/editor";

type LiteToolbarProps = {
  onSubmit: (e: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
  isEmpty: boolean;
  executeCommand: (item: ToolbarMenuItem) => void;
};

export const LiteToolbar = ({ onSubmit, isSubmitting, isEmpty, executeCommand }: LiteToolbarProps) => (
  <div className="flex items-center gap-2 pb-1">
    <button
      onClick={() => executeCommand(IMAGE_ITEM)}
      type="button"
      className="p-1 text-custom-text-300 hover:text-custom-text-200 transition-colors"
    >
      <Paperclip className="size-3" />
    </button>
    <button
      type="button"
      onClick={(e) => onSubmit(e)}
      disabled={isEmpty || isSubmitting}
      className="p-1 bg-custom-primary-100 hover:bg-custom-primary-200 disabled:bg-custom-text-400 disabled:text-custom-text-200 text-custom-text-100 rounded transition-colors"
    >
      <ArrowUp className="size-3" />
    </button>
  </div>
);

export type { LiteToolbarProps };
