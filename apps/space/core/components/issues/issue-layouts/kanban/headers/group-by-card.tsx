/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Circle } from "lucide-react";
// types
import type { TIssueGroupByOptions } from "@plane/types";

interface IHeaderGroupByCard {
  groupBy: TIssueGroupByOptions | undefined;
  icon?: React.ReactNode;
  title: string;
  count: number;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const { icon, title, count } = props;

  return (
    <>
      <div className="relative flex w-full shrink-0 flex-row items-center gap-2 p-1.5">
        <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>
        <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden">
          <div className="line-clamp-1 inline-block truncate overflow-hidden font-medium text-primary">{title}</div>
          <div className="shrink-0 pl-2 text-13 font-medium text-tertiary">{count || 0}</div>
        </div>
      </div>
    </>
  );
});
