import { Editor } from "@tiptap/core";
import React from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import { MathNodeVariant, TMathComponentProps } from "../../types";

type TBlockMathContainerProps = TMathComponentProps & {
  selected?: boolean;
  editor?: Editor;
  children: React.ReactNode;
  variant?: MathNodeVariant;
  className?: string;
  isEditable?: boolean;
};

export const BlockMathContainer: React.FC<TBlockMathContainerProps> = ({
  onClick,
  selected,
  editor,
  children,
  variant = "content",
  className,
  isEditable = true,
}) => {
  const baseClasses = "rounded-lg  px-4 my-2 min-h-[48px] transition-all duration-300 ease-in-out";

  const variantClasses = {
    empty: cn(
      "flex items-center justify-start gap-2 py-3 text-custom-text-300 bg-custom-background-90 border border-dashed border-custom-border-300 cursor-default",
      {
        "hover:text-custom-text-200 hover:bg-custom-background-80 cursor-pointer": isEditable,
        "text-custom-primary-200 bg-custom-primary-100/10 border-custom-primary-200/10 hover:bg-custom-primary-100/10 hover:text-custom-primary-200":
          selected && isEditable,
      }
    ),
    error: `flex bg-custom-background-90 py-3 text-custom-text-100 ${isEditable ? "hover:bg-custom-background-80 hover:shadow-md cursor-pointer" : "cursor-default"}`,
    content: `text-center flex items-center justify-center bg-custom-background-90 text-custom-text-100 overflow-hidden ${isEditable ? "cursor-pointer hover:bg-custom-background-80 hover:shadow-md" : "cursor-default"}`,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onMouseDown={onClick}
      {...(isEditable && { role: "button" })}
    >
      {children}
    </div>
  );
};
