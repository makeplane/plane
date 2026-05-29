export type TAIMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type TAIHandler = {
  menu?: (props: TAIMenuProps) => React.ReactNode;
};
