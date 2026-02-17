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

import type { PropsWithChildren } from "react";
import { useState } from "react";
import { ChevronDownIcon } from "@plane/propel/icons";
import { cn } from "@plane/ui";

type Props = {
  collapsible?: boolean;
  title: string;
  titleSuffix?: React.ReactNode;
  isDefaultOpen?: boolean;
} & PropsWithChildren;

export function FormSection({ collapsible, title, titleSuffix, children, isDefaultOpen = true }: Props) {
  const [collapsibleOpen, setCollapsibleOpen] = useState(isDefaultOpen);

  const handleToggle = () => {
    if (collapsible) {
      setCollapsibleOpen(!collapsibleOpen);
    }
  };

  return (
    <div className="bg-layer-1 rounded-lg p-6 flex flex-col gap-6">
      <div
        className={`flex items-center justify-between ${collapsible ? "cursor-pointer" : ""}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-16 font-medium">{title}</h3>
          {titleSuffix}
        </div>
        {collapsible && (
          <div className="flex items-center gap-2">
            <ChevronDownIcon
              className={cn(`size-4 transition-transform duration-200 `, {
                "rotate-180": collapsibleOpen,
              })}
            />
          </div>
        )}
      </div>
      {(!collapsible || collapsibleOpen) && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  );
}
