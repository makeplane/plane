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

import { useState } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";

type TProjectStateMarksAsDefault = { workspaceSlug: string; stateId: string; isDefault: boolean };

export const ProjectStateMarksAsDefault = observer(function ProjectStateMarksAsDefault(
  props: TProjectStateMarksAsDefault
) {
  const { workspaceSlug, stateId, isDefault } = props;
  // hooks
  const { markAsDefault } = useWorkspaceProjectStates();
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsDefault = async () => {
    if (!workspaceSlug || !stateId || isDefault) return;
    setIsLoading(true);

    try {
      setIsLoading(false);
      await markAsDefault(workspaceSlug, stateId);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn(
        "text-13 whitespace-nowrap transition-colors",
        isDefault ? "text-tertiary" : "text-secondary hover:text-primary"
      )}
      disabled={isDefault || isLoading}
      onClick={handleMarkAsDefault}
    >
      {isLoading ? "Marking as default" : isDefault ? `Default` : `Mark as default`}
    </button>
  );
});
