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

import React from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
// constants
import type { ToolbarMenuItem } from "@/constants/editor";
import { IMAGE_ITEM } from "@/constants/editor";

type LiteToolbarProps = {
  onSubmit: (e: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
  isEmpty: boolean;
  executeCommand: (item: ToolbarMenuItem) => void;
};

export function LiteToolbar({ onSubmit, isSubmitting, isEmpty, executeCommand }: LiteToolbarProps) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <IconButton variant="ghost" size="sm" icon={Paperclip} onClick={() => executeCommand(IMAGE_ITEM)} type="button" />
      <IconButton
        variant="primary"
        size="sm"
        icon={ArrowUp}
        onClick={(e) => onSubmit(e)}
        disabled={isEmpty || isSubmitting}
        type="button"
      />
    </div>
  );
}

export type { LiteToolbarProps };
