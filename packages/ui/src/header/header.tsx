import * as React from "react";
import { cn } from "../../helpers";
import { EHeaderVariant, getHeaderStyle, THeaderVariant } from "./helper";
import { ERowVariant, CustomRow } from "../row";

export interface HeaderProps {
  variant?: THeaderVariant;
  setHeight?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Header = (props: HeaderProps) => {
  const { variant = EHeaderVariant.PRIMARY, className = "", setHeight = true, children, ...rest } = props;

  const style = getHeaderStyle(variant, setHeight);
  return (
    <CustomRow
      variant={variant === EHeaderVariant.PRIMARY ? ERowVariant.HUGGING : ERowVariant.REGULAR}
      className={cn(style, className)}
      {...rest}
    >
      {children}
    </CustomRow>
  );
};

const LeftItem = (props: HeaderProps) => (
  <div className="flex flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">{props.children}</div>
);
const RightItem = (props: HeaderProps) => (
  <div className="w-full flex items-center justify-end gap-3">{props.children}</div>
);

Header.LeftItem = LeftItem;
Header.RightItem = RightItem;
Header.displayName = "plane-ui-header";

export { Header, EHeaderVariant };
