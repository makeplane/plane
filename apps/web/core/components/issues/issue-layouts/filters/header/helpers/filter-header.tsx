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

// plane imports
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";

type Props = {
  appendElement?: React.ReactNode;
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
};

export function FilterHeader({ appendElement, title, isPreviewEnabled, handleIsPreviewEnabled }: Props) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-2 bg-surface-1">
      <div className="grow truncate text-caption-sm-medium text-placeholder">{title}</div>
      <div className="shrink-0 flex items-center gap-1.5">
        {appendElement}
        <button
          type="button"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-sm hover:bg-layer-transparent-hover"
          onClick={handleIsPreviewEnabled}
        >
          {isPreviewEnabled ? <ChevronUpIcon height={14} width={14} /> : <ChevronDownIcon height={14} width={14} />}
        </button>
      </div>
    </div>
  );
}
