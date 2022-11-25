import type {
  UseFormRegister,
  RegisterOptions,
  FieldError,
} from "react-hook-form";

export type Props = {
  label?: string;
  id: string;
  name: string;
  value?: string | number | readonly string[];
  className?: string;
  register?: UseFormRegister<any>;
  disabled?: boolean;
  validations?: RegisterOptions;
  error?: FieldError;
  autoComplete?: "on" | "off";
  options: { label: string; value: any }[];
};
