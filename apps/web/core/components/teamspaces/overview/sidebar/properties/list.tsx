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

import Link from "next/link";
import { ChevronRightIcon } from "@plane/propel/icons";
// types
import type { TPropertyListItem } from "./root";

export const TeamsPropertiesList = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col pb-1 px-0.5 gap-x-2 gap-y-2">{children}</div>
);

export function TeamsPropertiesListItem(props: Omit<TPropertyListItem, "key">) {
  const { label, icon: Icon, value, href } = props;
  return (
    <div className="grid grid-cols-2 items-center py-1">
      <div className="flex items-center gap-x-2">
        <Icon className="size-4 text-tertiary" />
        <span className="text-body-xs-regular text-secondary">{label}</span>
      </div>
      {href ? (
        <Link
          href={href}
          className="group flex py-1 px-1 gap-2 items-center justify-between hover:bg-layer-1-hover rounded-sm cursor-pointer transition-all"
        >
          <span className="text-body-xs-regular text-secondary">{value}</span>
          <ChevronRightIcon className="size-3 text-placeholder group-hover:text-secondary" />
        </Link>
      ) : (
        <span className="py-1 px-1 text-body-xs-regular text-secondary">{value}</span>
      )}
    </div>
  );
}

TeamsPropertiesList.Item = TeamsPropertiesListItem;
