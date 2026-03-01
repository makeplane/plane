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

import { observer } from "mobx-react";
// constants
import { CloseIcon, PriorityIcon } from "@plane/propel/icons";
import { PROJECT_PRIORITIES } from "@/constants/project/default-root";
import type { TProjectPriority } from "@/types/workspace-project-filters";

type Props = {
  handleRemove: (val: TProjectPriority) => void;
  appliedFilters: TProjectPriority[];
  editable: boolean | undefined;
};

export const AppliedPriorityFilters = observer(function AppliedPriorityFilters(props: Props) {
  const { handleRemove, appliedFilters, editable } = props;

  return (
    <>
      {appliedFilters.map((priority) => {
        const priorityDetails = PROJECT_PRIORITIES.find((p) => p.key === priority);
        if (!priorityDetails) return null;
        return (
          <div key={priority} className="flex items-center gap-1 rounded-sm p-1 text-11 bg-layer-1">
            <PriorityIcon priority={priorityDetails.key} className={`h-3 w-3`} />
            {priorityDetails?.label}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(priority)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
