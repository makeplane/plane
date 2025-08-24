import React from "react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
};

export const AutomationDetailsMainContentBlockWrapper: React.FC<TProps> = (props) => {
  const { children, isSelected, onClick } = props;

  return (
    <div
      className={cn("flex-grow p-4 space-y-2 bg-custom-background-100 rounded-lg shadow-custom-shadow-2xs border", {
        "border-custom-primary-100": isSelected,
        "border-transparent": !isSelected,
      })}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
