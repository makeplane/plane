/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CircleDashedOutline } from "@makeplane/propel/icons";

interface IHeaderGroupByCard {
  groupID: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  isExpanded: boolean;
  toggleListGroup: (id: string) => void;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const { groupID, icon, title, count, isExpanded, toggleListGroup } = props;

  return (
    <>
      <button
        type="button"
        aria-expanded={isExpanded}
        className="group/list-header relative flex w-full shrink-0 items-center gap-2 px-2 py-1.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
        onClick={() => toggleListGroup(groupID)}
      >
        <div className="grid size-3.5 shrink-0 place-items-center overflow-hidden">
          {icon ?? <CircleDashedOutline className="size-3.5" />}
        </div>

        <div className="relative flex w-full cursor-pointer items-center gap-1 overflow-hidden">
          <div className="line-clamp-1 inline-block truncate text-body-sm-medium text-primary">{title}</div>
          <div className="pl-2 text-body-xs-medium text-tertiary">{count || 0}</div>
        </div>
      </button>
    </>
  );
});
