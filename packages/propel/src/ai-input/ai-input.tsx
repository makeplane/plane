/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "../utils";
import type { AIInputProps } from "./helper";

const SparkleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
    aria-hidden
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AIInput = React.forwardRef(function AIInput(props: AIInputProps, ref: React.ForwardedRef<HTMLInputElement>) {
  const {
    mode = "primary",
    inputSize = "sm",
    hasError = false,
    suggestion,
    isLoading = false,
    onAcceptSuggestion,
    onChange,
    onKeyDown,
    className,
    ...rest
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && suggestion && onAcceptSuggestion) {
      e.preventDefault();
      onAcceptSuggestion(suggestion);
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={ref}
          className={cn(
            "placeholder-tertiary w-full rounded-md border border-subtle-1 bg-layer-2 text-13 text-primary focus:ring-1 focus:ring-accent-strong focus:outline-none",
            {
              "border-xs": mode === "primary",
              "border-none bg-transparent ring-0": mode === "transparent",
              "border-danger-strong": hasError,
              "px-1.5 py-1 pr-7": inputSize === "xs",
              "px-3 py-2 pr-8": inputSize === "sm",
              "p-3 pr-9": inputSize === "md",
            },
            className
          )}
          aria-invalid={hasError || undefined}
          autoComplete="off"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...rest}
        />
        <span
          className={cn(
            "pointer-events-none absolute right-2.5 text-accent-primary",
            isLoading ? "opacity-70" : "opacity-60 hover:opacity-100"
          )}
        >
          {isLoading ? <LoadingSpinner /> : <SparkleIcon />}
        </span>
      </div>

      {suggestion && !isLoading && (
        <div className="shadow-sm absolute top-full left-0 z-10 mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-subtle bg-layer-3 px-3 py-1.5 text-12">
          <span className="truncate text-tertiary">{suggestion}</span>
          <kbd className="font-mono shrink-0 rounded border border-subtle bg-layer-2 px-1 py-0.5 text-10 text-secondary">
            Tab
          </kbd>
        </div>
      )}
    </div>
  );
});

AIInput.displayName = "ai-input";

export { AIInput };
