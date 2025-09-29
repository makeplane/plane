import { DraftingCompass, Presentation } from "lucide-react";
import React from "react";
import { cn } from "@plane/utils";
import { EDrawioMode } from "../types";

type DrawioInputBlockProps = {
  selected: boolean;
  isEditable: boolean;
  handleDrawioButtonClick: (event: React.MouseEvent) => void;
  mode: EDrawioMode;
  isFlagged?: boolean;
};

export const DrawioInputBlock = ({
  selected,
  isEditable,
  handleDrawioButtonClick,
  mode,
  isFlagged = false,
}: DrawioInputBlockProps) => (
  <div
    className={cn(
      "flex items-center justify-start gap-2 py-3 px-2 my-2 rounded-lg text-custom-text-300 bg-custom-background-90 border border-dashed border-custom-border-300 transition-all duration-200 ease-in-out cursor-default",
      {
        "hover:text-custom-text-200 hover:bg-custom-background-80 cursor-pointer": isEditable,
        "text-custom-primary-200 bg-custom-primary-100/10 border-custom-primary-200/10 hover:bg-custom-primary-100/10 hover:text-custom-primary-200":
          selected && isEditable,
      }
    )}
    onClick={isFlagged ? undefined : handleDrawioButtonClick}
  >
    {mode === EDrawioMode.BOARD ? (
      <Presentation className="size-4 shrink-0" />
    ) : (
      <DraftingCompass className="size-4 shrink-0" />
    )}

    <div className="text-base font-medium">
      {mode === EDrawioMode.BOARD ? "Click to start editing whiteboard" : "Click to start editing diagram"}
    </div>
  </div>
);
