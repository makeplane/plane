"use client";

import React, { useState } from "react";
// icons
import { Eye, EyeOff } from "lucide-react";
// ui
import { Input } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";

type Props = {
  type: "text" | "password";
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string | JSX.Element;
  placeholder: string;
  error: boolean;
};

export type TAuthFormInputFormField = {
  key: string;
  type: "text" | "password";
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string | JSX.Element;
  placeholder: string;
  error: boolean;
};

export const AuthFormInput: React.FC<Props> = (props) => {
  const { name, type, label, description, placeholder, error, value, onChange } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm text-custom-text-300">{label}</h4>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          hasError={error}
          placeholder={placeholder}
          className={cn("w-full rounded-md font-medium", {
            "pr-10": type === "password",
          })}
          autoComplete="off"
        />
        {type === "password" &&
          (showPassword ? (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          ))}
      </div>
      {description && <p className="pt-0.5 text-xs text-custom-text-300">{description}</p>}
    </div>
  );
};
