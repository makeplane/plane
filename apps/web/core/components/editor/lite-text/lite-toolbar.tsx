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

export function LiteToolbar({ onSubmit, isSubmitting, isEmpty, executeCommand }: LiteToolbarProps) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <button
        onClick={() => executeCommand(IMAGE_ITEM)}
        type="button"
        className="p-1 text-tertiary hover:text-secondary transition-colors"
      >
        <Paperclip className="size-3" />
      </button>
      <button
        type="button"
        onClick={(e) => onSubmit(e)}
        disabled={isEmpty || isSubmitting}
        className="p-1 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-layer-1 disabled:text-secondary text-primary rounded-sm transition-colors"
      >
        <ArrowUp className="size-3" />
      </button>
    </div>
  );
}

export type { LiteToolbarProps };
