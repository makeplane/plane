import React from "react";
import { cn } from "@plane/utils";
// types
import { MathNodeVariant, TMathComponentProps } from "../../types";

type TInlineMathContainerProps = TMathComponentProps & {
  children: React.ReactNode;
  variant?: MathNodeVariant;
  className?: string;
  title?: string;
  isEditable?: boolean;
};

export const InlineMathContainer: React.FC<TInlineMathContainerProps> = ({
  onClick,
  children,
  variant = "content",
  className,
  title,
  isEditable = true,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1 px-2 h-6 rounded transition-colors overflow-hidden leading-none";

  const variantClasses = {
    empty: `bg-custom-background-90 text-custom-text-300 ${isEditable ? "hover:bg-custom-background-80 hover:text-custom-text-200 cursor-pointer" : "cursor-default"}`,
    error: `bg-red-500/10 text-red-500 ${isEditable ? "hover:bg-red-500/20 cursor-pointer" : "cursor-default"}`,
    content: `${isEditable ? "hover:bg-custom-background-90 cursor-pointer" : "cursor-default"}`,
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      onMouseDown={onClick}
      title={title}
      {...(isEditable && { role: "button" })}
    >
      {children}
    </span>
  );
};
