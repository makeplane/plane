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

import { PlusIcon } from "@plane/propel/icons";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  count: number;
  label: string;
  handleAdd: () => void;
  style?: React.CSSProperties;
  onClick?: () => void;
  customClassName?: string;
  icon?: React.ReactNode;
};
export function ListHeader(props: Props) {
  const { count, label, handleAdd, style, onClick, customClassName, icon } = props;

  return (
    <Row
      onClick={onClick}
      className={cn("w-full flex-shrink-0 border-b-[1px] border-subtle bg-layer-1 pr-3 py-2.5", customClassName)}
      style={style}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <span className="text-13 font-medium text-primary flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </span>
          <span className="text-13 font-medium text-primary">{count}</span>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAdd();
          }}
          className="cursor-pointer"
        >
          <PlusIcon className="size-4" />
        </div>
      </div>
    </Row>
  );
}
