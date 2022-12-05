export type Props = {
  children: React.ReactNode;
  label: string;
};

export type MenuItemProps = {
  children: string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
};
