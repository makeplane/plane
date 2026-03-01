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

import { cn } from "@plane/utils";

type Props = {
  className?: string;
  input: React.ReactNode;
  inputClassName?: string;
  title: string;
  titleClassName?: string;
};

export function WidgetPropertyWrapper(props: Props) {
  const { className, input, inputClassName, title, titleClassName } = props;

  return (
    <div className={cn("h-8 grid grid-cols-9 items-center gap-2", className)}>
      <p className={cn("col-span-4 font-medium text-12 text-tertiary", titleClassName)}>{title}</p>
      <div className={cn("col-span-5 text-secondary", inputClassName)}>{input}</div>
    </div>
  );
}
