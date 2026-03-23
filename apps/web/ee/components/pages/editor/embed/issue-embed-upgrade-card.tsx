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

import { Crown } from "lucide-react";
// ui
import { Button } from "@plane/propel/button";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export function IssueEmbedUpgradeCard(props: any) {
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  return (
    <div
      className={`${
        props.selected ? "border-accent-strong-200 border-[2px]" : ""
      } w-full h-[100px] cursor-pointer space-y-2 rounded-md border-[0.5px] border-subtle-1 shadow-raised-100`}
    >
      <h5 className="h-[20%] text-11 text-tertiary p-2">
        {formatProjectWorkItemIdentifierForDisplay(
          props.node?.attrs?.project_identifier || "",
          props?.node?.attrs?.sequence_id
        )}
      </h5>
      <div className="relative h-[71%]">
        <div className="h-full backdrop-filter backdrop-blur-[30px] bg-layer-1/30 flex items-center w-full justify-between gap-5 mt-2.5 pl-4 pr-5 py-3 max-md:max-w-full max-md:flex-wrap relative">
          <div className="flex gap-2 items-center">
            <div className="rounded">
              <Crown className="m-2" size={16} color="#FFBA18" />
            </div>
            <div className="text-13">Embed and access work items in pages seamlessly, upgrade to plane pro now.</div>
          </div>
          <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}
