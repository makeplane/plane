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

import { cn } from "@plane/propel/utils";

type Props = {
  icon: JSX.Element;
  label: string;
  placeholder: string;
  onClick: () => void;
  isActiveTab?: boolean;
  value?: JSX.Element | null;
};

export function StateFlowPropertyButton(props: Props) {
  const { icon, label, placeholder, onClick, value, isActiveTab = false } = props;

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-body-xs-medium">{label}</span>
      <div
        role="button"
        className={cn(
          "flex items-center gap-1 rounded-lg border border-subtle py-2 px-3 bg-layer-2 w-full truncate",
          isActiveTab && "border-accent-strong"
        )}
        onClick={onClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onClick();
          }
        }}
      >
        {icon}
        {value ?? <span className="text-body-sm-regular">{placeholder}</span>}
      </div>
    </div>
  );
}
