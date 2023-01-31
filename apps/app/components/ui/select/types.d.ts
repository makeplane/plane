import type { UseFormRegister, RegisterOptions } from "react-hook-form";

export type Props = {
  label?: string;
  id: string;
  name: string;
  value?: string | number | readonly string[];
  className?: string;
  register?: UseFormRegister<any>;
  disabled?: boolean;
  validations?: RegisterOptions;
  error?: any;
  autoComplete?: "on" | "off";
  options: { label: string; value: any }[];
  size?: "rg" | "lg";
  fullWidth?: boolean;
};
