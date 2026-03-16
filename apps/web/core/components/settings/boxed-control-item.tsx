/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
        "flex w-full flex-col items-start gap-4 rounded-lg border border-subtle bg-layer-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8",
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
