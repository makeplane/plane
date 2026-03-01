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

import React from "react";
import { cn } from "@plane/utils";
// types
import type { MathNodeVariant, TMathComponentProps } from "../../types";

type TInlineMathContainerProps = TMathComponentProps & {
  children: React.ReactNode;
  variant?: MathNodeVariant;
  className?: string;
  title?: string;
  isEditable?: boolean;
};

export function InlineMathContainer({
  children,
  variant = "content",
  className,
  title,
  isEditable = true,
}: TInlineMathContainerProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-1 px-2 h-6 rounded-sm transition-colors overflow-hidden leading-none";

  const variantClasses = {
    empty: `bg-layer-1 text-tertiary ${isEditable ? "hover:bg-layer-1-hover hover:text-secondary cursor-pointer" : "cursor-default"}`,
    error: `bg-danger-subtle text-danger-primary ${isEditable ? "hover:bg-danger-subtle-hover cursor-pointer" : "cursor-default"}`,
    content: `${isEditable ? "hover:bg-layer-1-hover cursor-pointer" : "cursor-default"}`,
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      title={title}
      {...(isEditable && { role: "button" })}
    >
      {children}
    </span>
  );
}
