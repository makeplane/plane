type TMenuProps = {
  onClose: () => void;
};

export type TAIHandler = {
  menu?: (props: TMenuProps) => React.ReactNode;
};
