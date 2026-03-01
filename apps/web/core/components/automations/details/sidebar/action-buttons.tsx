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

// plane imports
import { Button } from "@plane/propel/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@plane/propel/icons";
import { cn } from "@plane/ui";

type TProps = {
  nextButton?: {
    type?: "button" | "submit";
    label: string;
    isDisabled?: boolean;
    onClick?: () => void | Promise<void>;
    renderIcon?: boolean;
  };
  previousButton?: {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void | Promise<void>;
    renderIcon?: boolean;
  };
  borderPosition?: "top" | "bottom";
};

export function AutomationDetailsSidebarActionButtons(props: TProps) {
  const { nextButton, previousButton, borderPosition = "top" } = props;

  return (
    <div
      className={cn("space-y-2 px-4", {
        "pt-4 border-t border-subtle-1": borderPosition === "top",
        "pb-4 border-b border-subtle-1": borderPosition === "bottom",
      })}
    >
      <div className="flex items-center justify-end gap-3">
        {previousButton && (
          <Button
            variant="secondary"
            prependIcon={previousButton.renderIcon === false ? undefined : <ChevronLeftIcon className="size-5" />}
            disabled={previousButton.isDisabled}
            onClick={() => {
              previousButton.onClick?.();
            }}
          >
            {previousButton.label}
          </Button>
        )}
        {nextButton && (
          <Button
            type={nextButton.type ?? "button"}
            variant="primary"
            appendIcon={nextButton.renderIcon === false ? undefined : <ChevronRightIcon className="size-5" />}
            disabled={nextButton.isDisabled}
            onClick={() => {
              nextButton.onClick?.();
            }}
          >
            {nextButton.label}
          </Button>
        )}
      </div>
    </div>
  );
}
