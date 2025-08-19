import React from "react";
import { cn } from "@plane/utils";

// Reusable Label Component
interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ htmlFor, children, className }) => (
  <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-custom-text-100", className)}>
    {children}
  </label>
);

// Reusable Form Field Component
interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children, className, optional = false }) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <Label htmlFor={htmlFor}>
      {label}
      {optional && <span className="text-custom-text-400 text-sm"> (optional)</span>}
    </Label>
    {children}
  </div>
);

// Reusable Validation Message Component
interface ValidationMessageProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ type, message, className }) => (
  <p
    className={cn(
      "text-sm",
      {
        "text-red-500": type === "error",
        "text-green-500": type === "success",
      },
      className
    )}
  >
    {message}
  </p>
);
