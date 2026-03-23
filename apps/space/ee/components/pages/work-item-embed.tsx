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
import { AlertTriangle } from "lucide-react";
// ui
import { Loader } from "@plane/ui";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// components
import { IssueBlockPriority } from "@/components/issues/issue-layouts/properties/priority";
import { IssueBlockState } from "@/components/issues/issue-layouts/properties/state";
// plane web hooks
import { usePage } from "@/plane-web/hooks/store";

type Props = {
  anchor: string;
  workItemId: string;
};

export const WorkItemEmbedCard = observer(function WorkItemEmbedCard(props: Props) {
  const { anchor, workItemId } = props;
  // store hooks
  const pageDetails = usePage(anchor);

  if (!pageDetails) return null;

  // derived values
  const { getEmbedDetails, hasLoadedEmbedsAndMentions } = pageDetails;
  const workItemDetails = getEmbedDetails("issue", workItemId);

  if (!hasLoadedEmbedsAndMentions)
    return (
      <Loader className="rounded-md bg-layer-1 p-3 my-2">
        <Loader.Item height="30px" />
        <div className="mt-3 space-y-2">
          <Loader.Item height="20px" width="70%" />
          <Loader.Item height="20px" width="60%" />
        </div>
      </Loader>
    );

  if (!workItemDetails)
    return (
      <div className="flex items-center gap-2 rounded-md border border-orange-500 bg-orange-500/10 text-orange-500 px-4 py-3 my-2">
        <AlertTriangle className="text-orange-500 size-5" />
        <p className="!text-13">This work item embed could not be found. It might have been deleted.</p>
      </div>
    );

  return (
    <div className="issue-embed space-y-2 rounded-md bg-layer-1 p-3 my-2 cursor-default">
      <h5 className="!text-11 !font-normal !mt-0 text-tertiary">
        {formatProjectWorkItemIdentifierForDisplay(
          workItemDetails?.project__identifier || "",
          workItemDetails?.sequence_id
        )}
      </h5>
      <h4 className="!text-13 !font-medium !mt-1 line-clamp-2 break-words">{workItemDetails?.name}</h4>
      <div className="hide-horizontal-scrollbar relative flex w-full flex-grow items-end gap-2 overflow-x-scroll">
        {/* state */}
        <div className="flex-shrink-0 h-5">
          <IssueBlockState
            stateDetails={{
              name: workItemDetails?.state__name,
              group: workItemDetails?.state__group,
            }}
          />
        </div>
        {/* priority */}
        {workItemDetails?.priority && (
          <div className="flex-shrink-0 h-5">
            <IssueBlockPriority priority={workItemDetails?.priority} />
          </div>
        )}
      </div>
    </div>
  );
});
