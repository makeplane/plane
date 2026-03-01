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

import { observer } from "mobx-react";
import { CircleDashed } from "lucide-react";

interface IHeaderGroupByCard {
  groupID: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  toggleListGroup: (id: string) => void;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const { groupID, icon, title, count, toggleListGroup } = props;

  return (
    <>
      <div
        className="group/list-header relative w-full flex-shrink-0 flex items-center gap-2 py-1.5"
        onClick={() => toggleListGroup(groupID)}
      >
        <div className="flex-shrink-0 grid place-items-center overflow-hidden">
          {icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
        </div>

        <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden cursor-pointer">
          <div className="inline-block line-clamp-1 truncate font-medium text-primary">{title}</div>
          <div className="pl-2 text-13 font-medium text-tertiary">{count || 0}</div>
        </div>
      </div>
    </>
  );
});
