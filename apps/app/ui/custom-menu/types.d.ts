export type Props = {
  children: React.ReactNode;
  label?: string | JSX.Element;
  className?: string;
  ellipsis?: boolean;
  width?: "auto";
  textAlignment?: "left" | "center" | "right";
  withoutBorder?: boolean;
  optionsPosition?: "left" | "right";
};

export type MenuItemProps = {
  children: string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
};
