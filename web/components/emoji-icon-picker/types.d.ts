export type Props = {
  label: React.ReactNode;
  value: any;
  onChange: (
    data:
      | string
      | {
          name: string;
          color: string;
        }
  ) => void;
  onIconColorChange?: (data: any) => void;
  disabled?: boolean;
  tabIndex?: number;
};
