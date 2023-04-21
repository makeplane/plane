export type Props = {
  label: string | React.ReactNode;
  value: any;
  onChange: (data: any) => void;
  onIconsClick?: (data: any) => void;
  onIconColorChange?: (data: any) => void;
};
