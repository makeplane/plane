/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ChevronDownOutline, ChevronUpOutline, CircleOutline } from "@makeplane/propel/icons";
// mobx

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export const HeaderSubGroupByCard = observer(function HeaderSubGroupByCard(props: IHeaderSubGroupByCard) {
  const { icon, title, count, isExpanded, toggleExpanded } = props;
  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      className={`relative flex w-full flex-shrink-0 cursor-pointer flex-row items-center gap-2 rounded-xs p-1.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset`}
      onClick={() => toggleExpanded()}
    >
      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1">
        {isExpanded ? <ChevronUpOutline width={14} height={14} /> : <ChevronDownOutline width={14} height={14} />}
      </div>

      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
        {icon ? icon : <CircleOutline width={14} height={14} />}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 text-body-xs-regular">
        <div className="line-clamp-1 text-primary">{title}</div>
        <div className="pl-2 text-body-xs-medium text-tertiary">{count || 0}</div>
      </div>
    </button>
  );
});
