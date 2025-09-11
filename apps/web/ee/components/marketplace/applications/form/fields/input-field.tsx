import { FieldValues, UseFormRegister } from "react-hook-form";
import { cn, Input } from "@plane/ui";
import { BaseFieldProps, FieldWrapper } from "./base-field";

type Props<T extends FieldValues> = BaseFieldProps<T> & {
  type: "text" | "email" | "url";
  register: UseFormRegister<T>;
  onChange?: (value: string) => void;
};

export const InputField = <T extends FieldValues>(props: Props<T>) => {
  const { id, type, placeholder, disabled, tabIndex, error, className = "", register, validation, onChange } = props;

  return (
    <FieldWrapper {...props}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(`w-full resize-none text-sm bg-custom-background-100`, className)}
        hasError={Boolean(error)}
        disabled={disabled}
        tabIndex={tabIndex}
        {...register(id, {
          ...validation,
          onChange: (e) => onChange?.(e.target.value),
        })}
      />
    </FieldWrapper>
  );
};
