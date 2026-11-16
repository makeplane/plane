/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { GroupOutline, LabelsFilled } from "@makeplane/propel/icons";

interface ILabelName {
  name: string;
  color: string;
  isGroup: boolean;
}

export function LabelName(props: ILabelName) {
  const { name, color, isGroup } = props;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {isGroup ? (
        <GroupOutline className="size-4 shrink-0" color={color} />
      ) : (
        <LabelsFilled className="size-4 shrink-0" color={color && color !== "" ? color : "#000"} />
      )}
      <h6 className="truncate text-body-sm-medium">{name}</h6>
    </div>
  );
}
