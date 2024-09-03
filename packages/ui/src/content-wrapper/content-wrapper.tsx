import * as React from "react";
import { cn } from "../../helpers";
import { CustomRow } from "../row";
import { ERowVariant, TRowVariant } from "../row/helper";

export interface ContentWrapperProps {
  variant?: TRowVariant;
  className?: string;
  children: React.ReactNode;
}

const ContentWrapper = (props: ContentWrapperProps) => {
  const { variant = ERowVariant.REGULAR, className = "", children, ...rest } = props;

  return (
    <CustomRow
      variant={variant}
      className={cn(
        "flex flex-col vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto",
        {
          "py-page-y": variant === ERowVariant.REGULAR,
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
