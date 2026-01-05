import * as React from "react";
import { ERowVariant, Row } from "../row";
import { cn } from "../utils";
import type { THeaderVariant } from "./helper";
import { EHeaderVariant, getHeaderStyle } from "./helper";

export interface HeaderProps {
  variant?: THeaderVariant;
  setHeight?: boolean;
  className?: string;
  children: React.ReactNode;
  showOnMobile?: boolean;
}

const HeaderContext = React.createContext<THeaderVariant | null>(null);

function Header(props: HeaderProps) {
  const {
    variant = EHeaderVariant.PRIMARY,
    className = "",
    showOnMobile = true,
    setHeight = true,
    children,
    ...rest
  } = props;

  const style = getHeaderStyle(variant, setHeight, showOnMobile);
  return (
    <HeaderContext.Provider value={variant}>
      <Row
        variant={variant === EHeaderVariant.PRIMARY ? ERowVariant.HUGGING : ERowVariant.REGULAR}
        className={cn(style, className)}
        {...rest}
      >
        {children}
      </Row>
    </HeaderContext.Provider>
  );
}

function LeftItem(props: HeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 overflow-ellipsis whitespace-nowrap max-w-[80%] flex-grow",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

function RightItem(props: HeaderProps) {
  const variant = React.useContext(HeaderContext);
  if (variant === undefined) throw new Error("RightItem must be used within Header");
  return (
    <div
      className={cn(
        "flex justify-end gap-2 w-auto items-center",
        {
          "items-baseline": variant === EHeaderVariant.TERNARY,
        },
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

Header.LeftItem = LeftItem;
Header.RightItem = RightItem;
Header.displayName = "plane-ui-header";

export { Header, EHeaderVariant };
