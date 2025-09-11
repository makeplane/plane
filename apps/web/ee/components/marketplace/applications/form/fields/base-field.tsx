import { FieldError, FieldValues, Path, RegisterOptions } from "react-hook-form";

export type BaseFieldProps<T extends FieldValues> = {
  id: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  tabIndex?: number;
  error?: FieldError;
  className?: string;
  validation?: RegisterOptions<T>;
};

export const FieldWrapper = <T extends FieldValues>({
  label,
  description,
  error,
  validation,
  children,
}: BaseFieldProps<T> & { children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <div className="text-xs text-custom-text-100 font-medium gap-1">
        {label}
        <span className="text-red-500">{validation?.required && <sup>*</sup>}</span>
      </div>
    )}
    {description && <div className="text-xs text-custom-text-300">{description}</div>}
    {children}
    {error && <p className="text-red-500 text-xs">{error.message}</p>}
  </div>
);
