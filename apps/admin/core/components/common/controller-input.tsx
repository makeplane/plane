import React, { useState } from "react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// icons
import { Eye, EyeOff } from "lucide-react";
// plane internal packages
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  control: Control<any>;
  type: "text" | "password";
  name: string;
  label: string;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export type TControllerInputFormField = {
  key: string;
  type: "text" | "password";
  label: string;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export function ControllerInput(props: Props) {
  const { name, control, type, label, description, placeholder, error, required } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-13 text-tertiary">{label}</h4>
      <div className="relative">
        <Controller
          control={control}
          name={name}
          rules={{ required: required ? `${label} is required.` : false }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id={name}
              name={name}
              type={type === "password" && showPassword ? "text" : type}
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={error}
              placeholder={placeholder}
              className={cn("w-full rounded-md font-medium", {
                "pr-10": type === "password",
              })}
            />
          )}
        />
        {type === "password" &&
          (showPassword ? (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          ))}
      </div>
      {description && <p className="pt-0.5 text-11 text-tertiary">{description}</p>}
    </div>
  );
}
