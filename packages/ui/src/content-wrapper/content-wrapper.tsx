import * as React from "react";
import { cn } from "../../helpers";
import { Row } from "../row";
import { ERowVariant, TRowVariant } from "../row/helper";

export interface ContentWrapperProps {
  variant?: TRowVariant;
  className?: string;
  children: React.ReactNode;
}
const DEFAULT_STYLE = "flex flex-col vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto";

const ContentWrapper = (props: ContentWrapperProps) => {
  const { variant = ERowVariant.REGULAR, className = "", children, ...rest } = props;

  return (
    <Row
      variant={variant}
      className={cn(
        DEFAULT_STYLE,
        {
          "py-page-y": variant === ERowVariant.REGULAR,
        },
        className
      )}
      {...rest}
    >
      {children}
    </Row>
  );
};

ContentWrapper.displayName = "plane-ui-wrapper";

export { ContentWrapper };
