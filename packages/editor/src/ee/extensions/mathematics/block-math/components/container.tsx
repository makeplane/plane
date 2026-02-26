/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Editor } from "@tiptap/core";
import React from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { MathNodeVariant, TMathComponentProps } from "../../types";

type TBlockMathContainerProps = TMathComponentProps & {
  selected?: boolean;
  editor?: Editor;
  children: React.ReactNode;
  variant?: MathNodeVariant;
  className?: string;
  isEditable?: boolean;
};

export function BlockMathContainer({
  selected,
  editor,
  children,
  variant = "content",
  className,
  isEditable = true,
}: TBlockMathContainerProps) {
  const isTouchDevice = !!editor?.storage.utility.isTouchDevice;

  const baseClasses = "rounded-lg  px-4 my-2 min-h-[48px] transition-all duration-300 ease-in-out";

  const borderColor =
    selected && editor?.isEditable && variant === "empty"
      ? "color-mix(in srgb, var(--border-color-accent-strong) 20%, transparent)"
      : undefined;

  const variantClasses = {
    empty: cn(
      "flex items-center justify-start gap-2 py-3 text-tertiary bg-layer-3 border border-dashed transition-all duration-200 ease-in-out cursor-default",
      {
        "border-subtle-1": !(selected && editor?.isEditable),
        "hover:text-secondary hover:bg-layer-3-hover cursor-pointer": isEditable && !isTouchDevice,
        "text-accent-secondary bg-accent-primary/10 border-accent-strong-200/10 hover:bg-accent-primary/10 hover:text-accent-secondary":
          selected && isEditable,
      }
    ),
    error: `flex bg-layer-3 py-3 text-primary ${isEditable && !isTouchDevice ? "hover:bg-layer-3-hover hover:shadow-md cursor-pointer" : "cursor-default"}`,
    content: `text-center bg-layer-3 text-primary overflow-hidden ${isEditable && !isTouchDevice ? "cursor-pointer hover:bg-layer-3-hover hover:shadow-md" : "cursor-default"}`,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={borderColor ? { borderColor } : undefined}
      {...(isEditable && { role: "button" })}
    >
      {children}
    </div>
  );
}
