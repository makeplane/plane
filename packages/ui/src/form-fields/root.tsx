import React from "react";
import { cn } from "@plane/utils";

// Reusable Label Component
interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

export function Label({ htmlFor, children, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-13 font-medium text-primary", className)}>
      {children}
    </label>
  );
}

// Reusable Form Field Component
interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}

export function FormField({ label, htmlFor, children, className, optional = false }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="text-placeholder text-13"> (optional)</span>}
      </Label>
      {children}
    </div>
  );
}

// Reusable Validation Message Component
interface ValidationMessageProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export function ValidationMessage({ type, message, className }: ValidationMessageProps) {
  return (
    <p
      className={cn(
        "text-13",
        {
          "text-danger-primary": type === "error",
          "text-success-primary": type === "success",
        },
        className
      )}
    >
      {message}
    </p>
  );
}
