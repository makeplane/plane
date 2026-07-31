/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "../utils";
import type { ThinkingIndicatorProps } from "./helper";
import { thinkingDotVariants, thinkingIndicatorVariants } from "./helper";

const ThinkingIndicator = React.forwardRef(function ThinkingIndicator(
  { status = "thinking", size = "base", className }: ThinkingIndicatorProps,
  ref: React.ForwardedRef<HTMLSpanElement>
) {
  if (status === "done") return null;

  return (
    <span
      ref={ref}
      role="status"
      aria-label={status === "thinking" ? "AI is thinking" : "AI is typing"}
      className={cn(thinkingIndicatorVariants({ size }), className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(thinkingDotVariants({ size }), "animate-bounce")}
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
});

ThinkingIndicator.displayName = "ai-thinking-indicator";

export { ThinkingIndicator };
