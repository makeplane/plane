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
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  title: React.ReactNode;
};

export function SettingsBoxedControlItem(props: Props) {
  const { className, control, description, title } = props;

  return (
    <div
      className={cn(
        "w-full bg-layer-2 rounded-lg border border-subtle px-4 py-3 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 md:gap-8",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h4 className="text-body-sm-medium text-primary">{title}</h4>
        {description && <p className="text-caption-md-regular text-tertiary">{description}</p>}
      </div>
      {control && <div className="shrink-0">{control}</div>}
    </div>
  );
}
