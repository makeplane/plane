export type Props = {
  children: React.ReactNode;
  label: string;
  textAlignment?: "left" | "center" | "right";
};

export type MenuItemProps = {
  children: string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
};
