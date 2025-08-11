import { X } from "lucide-react";
import * as React from "react";
// helpers
import { cn } from "../utils";

export interface PillInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  mode?: "primary" | "transparent" | "true-transparent";
  inputSize?: "xs" | "sm" | "md";
  hasError?: boolean;
  className?: string;
  autoComplete?: "on" | "off";
  value: string[];
  onChange: (value: string[]) => void;
  pillClassName?: string;
  removePillClassName?: string;
  separator?: string;
  helperText?: string;
  helperTextClassName?: string;
}

export const PillInput = React.forwardRef<HTMLInputElement, PillInputProps>((props, ref) => {
  const {
    id,
    type = "text",
    name,
    mode = "primary",
    inputSize = "sm",
    hasError = false,
    className = "",
    autoComplete = "off",
    value = [],
    onChange,
    placeholder,
    pillClassName = "",
    removePillClassName = "",
    separator = ",",
    helperText,
    helperTextClassName,
    ...rest
  } = props;
  // refs
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Combine refs
  React.useImperativeHandle(ref, () => inputRef.current!);
  // states
  const [inputValue, setInputValue] = React.useState("");

  // handlers
  const addPill = (pillText: string) => {
    const trimmedText = pillText.trim();
    if (trimmedText && !value.includes(trimmedText)) {
      onChange([...value, trimmedText]);
    }
    setInputValue("");
  };

  const removePill = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const removeLastPill = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check if user typed the separator
    if (newValue.endsWith(separator)) {
      const pillText = newValue.slice(0, -1);
      addPill(pillText);
    } else {
      setInputValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPill(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      e.preventDefault();
      removeLastPill();
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addPill(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Split the pasted text by commas, newlines, or spaces
    const potentialPills = pastedText.split(/[,\n\s]+/).filter((text) => text.trim());

    // Add each non-empty piece as a pill
    const newPills = [...value];
    potentialPills.forEach((pill) => {
      const trimmedPill = pill.trim();
      if (trimmedPill && !newPills.includes(trimmedPill)) {
        newPills.push(trimmedPill);
      }
    });

    onChange(newPills);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex min-h-[40px] w-full flex-wrap items-center gap-1 rounded-md bg-transparent text-sm focus-within:outline-none",
          {
            "rounded-md border-[0.5px] border-custom-border-200": mode === "primary",
            "rounded border-none bg-transparent ring-0 transition-all focus-within:ring-1 focus-within:ring-custom-primary":
              mode === "transparent",
            "rounded border-none bg-transparent ring-0": mode === "true-transparent",
            "border-red-500": hasError,
            "px-1.5 py-1": inputSize === "xs",
            "px-3 py-2": inputSize === "sm",
            "p-3": inputSize === "md",
          },
          className
        )}
        onClick={handleContainerClick}
      >
        {/* Render pills */}
        {value.map((pill, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1 rounded-full bg-custom-background-80 text-xs py-0.5",
              {
                "px-2": inputSize === "xs",
                "px-2.5": inputSize === "sm",
                "px-3": inputSize === "md",
              },
              pillClassName
            )}
          >
            <span>{pill}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePill(index);
              }}
              className={cn("text-custom-text-300 hover:text-custom-text-200", removePillClassName)}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {/* Input field */}
        <input
          id={id}
          ref={inputRef}
          type={type}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 border-none bg-transparent outline-none placeholder-custom-text-400 min-w-[120px]"
          autoComplete={autoComplete}
          {...rest}
        />
      </div>
      {/* Helper text */}
      {helperText && <p className={cn("text-[8px] text-custom-text-300", helperTextClassName)}>{helperText}</p>}
    </div>
  );
});
PillInput.displayName = "pill-input-field";
