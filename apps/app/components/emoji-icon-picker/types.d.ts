export type Props = {
  label: string | React.ReactNode;
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
};
