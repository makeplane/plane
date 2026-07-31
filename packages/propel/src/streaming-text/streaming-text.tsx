/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "../utils";

export interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  showCursor?: boolean;
  className?: string;
}

const StreamingText = React.forwardRef(function StreamingText(
  { text, isStreaming = false, showCursor = true, className }: StreamingTextProps,
  ref: React.ForwardedRef<HTMLSpanElement>
) {
  return (
    <span ref={ref} className={cn("break-words whitespace-pre-wrap", className)}>
      {text}
      {isStreaming && showCursor && (
        <span
          aria-hidden
          className="ml-px inline-block h-[1em] w-0.5 animate-pulse bg-accent-primary align-text-bottom"
        />
      )}
    </span>
  );
});

StreamingText.displayName = "ai-streaming-text";

export { StreamingText };
