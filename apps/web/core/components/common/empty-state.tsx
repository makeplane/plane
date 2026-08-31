/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { cloneElement, isValidElement } from "react";

// ui
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";

function withIconSize(icon: React.ReactNode, sizeClass: string) {
  if (!isValidElement<{ className?: string }>(icon)) return icon;
  return cloneElement(icon, { className: cn(sizeClass, icon.props.className) });
}

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
  primaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  secondaryButton?: React.ReactNode;
  disabled?: boolean;
};

export function EmptyState({ title, description, image, primaryButton, secondaryButton, disabled = false }: Props) {
  return (
    <div className={`flex h-full w-full items-center justify-center`}>
      <div className="flex w-full flex-col items-center text-center">
        <img src={image} className="w-52 object-contain sm:w-60" alt={primaryButton?.text || "button image"} />
        <h6 className="mt-6 mb-3 text-18 font-semibold sm:mt-8">{title}</h6>
        {description && <p className="mb-7 px-5 text-tertiary sm:mb-8">{description}</p>}
        <div className="flex items-center gap-4">
          {primaryButton && (
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              label={primaryButton.text}
              icon={withIconSize(primaryButton.icon, "size-3.5")}
              onClick={primaryButton.onClick}
              disabled={disabled}
            />
          )}
          {secondaryButton}
        </div>
      </div>
    </div>
  );
}
