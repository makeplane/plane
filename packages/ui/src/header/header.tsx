import * as React from "react";
import { cn } from "../../helpers";
import { EHeaderVariant, getHeaderStyle, THeaderVariant } from "./helper";
import { ERowVariant, Row } from "../row";

export interface HeaderProps {
  variant?: THeaderVariant;
  setHeight?: boolean;
  className?: string;
  children: React.ReactNode;
  showOnMobile?: boolean;
}

const HeaderContext = React.createContext<THeaderVariant | null>(null);
const Header = (props: HeaderProps) => {
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
};

const LeftItem = (props: HeaderProps) => (
  <div
    className={cn("flex flex-wrap items-center gap-2 overflow-ellipsis whitespace-nowrap max-w-[80%]", props.className)}
  >
    {props.children}
  </div>
);
const RightItem = (props: HeaderProps) => {
  const variant = React.useContext(HeaderContext);
  if (variant === undefined) throw new Error("RightItem must be used within Header");
  return (
    <div
      className={cn(
        "flex justify-end gap-3 w-auto items-start",
        {
          "items-baseline": variant === EHeaderVariant.TERNARY,
        },
        props.className
      )}
    >
      {props.children}
    </div>
  );
};

Header.LeftItem = LeftItem;
Header.RightItem = RightItem;
Header.displayName = "plane-ui-header";

export { Header, EHeaderVariant };
