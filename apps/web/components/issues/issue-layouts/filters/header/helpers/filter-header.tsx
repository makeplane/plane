/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ChevronDownOutline, ChevronUpOutline } from "@makeplane/propel/icons";

type Props = {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
};

export function FilterHeader({ title, isPreviewEnabled, handleIsPreviewEnabled }: Props) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-2 bg-layer-2">
      <div className="flex-grow truncate text-caption-sm-medium text-placeholder">{title}</div>
      <IconButton
        type="button"
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
