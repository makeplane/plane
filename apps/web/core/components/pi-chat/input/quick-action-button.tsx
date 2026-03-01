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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";

type Props = {
  disabled?: boolean;
  isLoading: boolean;
  open: () => void;
};

export const AttachmentActionButton = observer(function AttachmentActionButton(props: Props) {
  const { isLoading, disabled = false, open } = props;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="inline-flex items-center"
    >
      {/* Button: opens native file picker */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // open file dialog exposed by useDropzone
          if (!disabled && !isLoading) open();
        }}
        disabled={disabled || isLoading}
        aria-label="Attach files"
        className="size-8 flex items-center justify-center hover:bg-layer-1 rounded-full"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    </div>
  );
});
