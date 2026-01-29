/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LockIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";

export function LockedComponent(props: { toolTipContent?: string }) {
  const { toolTipContent } = props;
  const lockedComponent = (
    <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-layer-1 px-3 py-0.5 text-11 font-medium text-tertiary">
      <LockIcon className="h-3 w-3" />
      <span>Locked</span>
    </div>
  );

  return (
    <>
      {toolTipContent ? <Tooltip tooltipContent={toolTipContent}>{lockedComponent}</Tooltip> : <>{lockedComponent}</>}
    </>
  );
}
