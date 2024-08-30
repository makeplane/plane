import * as React from "react";
import { cn } from "../../helpers";
import { CustomRow } from "../row";

export interface ContentWrapperProps {
  variant?: "regular" | "hugging";
  className?: string;
  children: React.ReactNode;
}

const ContentWrapper = (props: ContentWrapperProps) => {
  const { variant = "regular", className = "", children, ...rest } = props;

  return (
    <CustomRow
      variant={variant}
      className={cn(
        "flex flex-col vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto",
        {
          "py-page-y": variant === "regular",
        },
        className
      )}
      {...rest}
    >
      {children}
    </CustomRow>
  );
};

ContentWrapper.displayName = "plane-ui-wrapper";

export { ContentWrapper };
