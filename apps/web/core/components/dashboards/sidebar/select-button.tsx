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
  placeholder: string;
  title: string;
  value: boolean;
};

export function WidgetConfigSelectButton(props: Props) {
  const { placeholder, title, value } = props;

  return (
    <div
      className={cn("w-full px-2 py-1 rounded-sm hover:bg-layer-1 text-left cursor-pointer transition-colors", {
        "text-placeholder": !value,
      })}
    >
      {value ? title : placeholder}
    </div>
  );
}
