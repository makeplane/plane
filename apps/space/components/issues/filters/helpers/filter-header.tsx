/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
// icons
import { ChevronDownOutline, ChevronUpOutline } from "@makeplane/propel/icons";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
}

export function FilterHeader({ title, isPreviewEnabled, handleIsPreviewEnabled }: IFilterHeader) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-2 bg-layer-2">
      <div className="grow truncate text-caption-sm-medium text-placeholder">{title}</div>
      <IconButton
        variant="ghost"
        size="xs"
        aria-label={title}
        aria-expanded={isPreviewEnabled}
        showTooltip={false}
        onClick={handleIsPreviewEnabled}
        icon={<Icon icon={isPreviewEnabled ? ChevronUpOutline : ChevronDownOutline} />}
      />
    </div>
  );
}
