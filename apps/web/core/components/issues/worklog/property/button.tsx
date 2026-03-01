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
import { Loader } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";

type TIssueWorklogPropertyButton = { content?: string; isLoading?: boolean };

export function IssueWorklogPropertyButton(props: TIssueWorklogPropertyButton) {
  const { content, isLoading } = props;

  return (
    <div className="flex justify-between items-center text-13 py-2 rounded-sm transition-all cursor-not-allowed w-full">
      <div
        className={cn({
          "text-tertiary": !content,
        })}
      >
        {(content || "").length > 0 ? content : "0h 0m"}
      </div>
      {isLoading ? (
        <div className="transition-all flex-shrink-0 w-4 h-4 flex justify-center items-center text-placeholder animate-spin">
          <Loader size={14} />
        </div>
      ) : (
        <div className="transition-all flex-shrink-0 w-4 h-4 hidden group-hover:flex justify-center items-center text-placeholder">
          <PlusIcon height={14} width={14} />
        </div>
      )}
    </div>
  );
}
