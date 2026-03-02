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

import { LabelFilledIcon } from "@plane/propel/icons";
import { Component } from "lucide-react";

interface ILabelName {
  name: string;
  color: string;
  isGroup: boolean;
}

export function LabelName(props: ILabelName) {
  const { name, color, isGroup } = props;

  return (
    <div className="flex items-center gap-3 pr-20">
      {isGroup ? (
        <Component className="h-3.5 w-3.5" color={color} />
      ) : (
        <LabelFilledIcon className="h-3.5 w-3.5 flex-shrink-0 rounded-full" color={color} />
      )}
      <h6 className="text-13">{name}</h6>
    </div>
  );
}
