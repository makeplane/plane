export type Props = {
  children: React.ReactNode;
  label?: string | JSX.Element;
  className?: string;
  ellipsis?: boolean;
  width?: "sm" | "md" | "lg" | "xl" | "auto";
  textAlignment?: "left" | "center" | "right";
  noBorder?: boolean;
  optionsPosition?: "left" | "right";
};

export type MenuItemProps = {
  children: JSX.Element | string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
  className?: string;
};
