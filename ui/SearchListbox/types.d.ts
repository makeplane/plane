type Value = any;

export type Props = {
  title: string;
  multiple?: boolean;
  options?: Array<{ display: string; element?: JSX.Element; value: Value }>;
  onChange: (value: Value) => void;
  value: Value;
  icon?: JSX.Element;
  buttonClassName?: string;
  optionsClassName?: string;
  width?: "sm" | "md" | "lg" | "xl" | "2xl";
  optionsFontsize?: "sm" | "md" | "lg" | "xl" | "2xl";
};
