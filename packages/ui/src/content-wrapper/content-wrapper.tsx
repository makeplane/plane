import * as React from "react";
import { cn } from "../../helpers";
import { Row } from "../row";
import { ERowVariant, TRowVariant } from "../row/helper";

export interface ContentWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TRowVariant;
  className?: string;
  children: React.ReactNode;
}
const DEFAULT_STYLE = "flex flex-col vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto";

const ContentWrapper = React.forwardRef<HTMLDivElement, ContentWrapperProps>((props, ref) => {
  const { variant = ERowVariant.REGULAR, className = "", children, ...rest } = props;

  return (
    <Row
      ref={ref}
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
});

ContentWrapper.displayName = "plane-ui-wrapper";

export { ContentWrapper };
