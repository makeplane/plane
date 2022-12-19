export type Props = {
  title?: string;
  label?: string;
  options?: Array<{ display: string; value: any; color?: string }>;
  icon?: JSX.Element;
  value: any;
  onChange: (value: any) => void;
  multiple?: boolean;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "w-full";
  optionsFontsize?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  footerOption?: JSX.Element;
};
