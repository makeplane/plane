import React from "react";
import type { UseFormRegister, RegisterOptions, FieldError } from "react-hook-form";

export interface Props extends React.ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  value?: string | number | readonly string[];
  name: string;
  register?: UseFormRegister<any>;
  mode?: "primary" | "transparent" | "secondary" | "disabled";
  validations?: RegisterOptions;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
}
