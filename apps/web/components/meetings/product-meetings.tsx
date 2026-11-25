/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// services
import { MeetingService } from "@/services/meeting.service";
// components
import { KindIcon } from "@/components/products/kind-icon";
// local imports
import { formatMeetingTime } from "./time";
import { useReaderTimezone } from "./use-reader-timezone";

const meetingService = new MeetingService();

type Props = { workspaceSlug: string; projectId: string; productId: string };

/** Meetings about a product, next to its tasks. */
export const ProductMeetings = observer(function ProductMeetings(props: Props) {
  const { workspaceSlug, projectId, productId } = props;
  const { t, currentLocale } = useTranslation();
  const timeZone = useReaderTimezone();
  const { getProjectIdentifierById } = useProject();
  const {
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();
  // reloads when something is linked or unlinked
  const childIds = (subIssuesByIssueId(productId) ?? []).join();
  const { data } = useSWR(["PRODUCT_MEETINGS", workspaceSlug, projectId, productId, childIds], () =>
    meetingService.list(workspaceSlug, projectId, { parent_id: productId })
  );

  if (!data?.length) return null;

  return (
    <section aria-label={t("meeting.meetings")} className="space-y-2 py-3">
      <h6 className="text-body-sm-medium text-primary">
        {t("meeting.meetings")} <span className="text-tertiary">{data.length}</span>
      </h6>
      <ul className="space-y-1">
        {data.map((meeting) => (
          <li key={meeting.id}>
            <Link
              href={generateWorkItemLink({
                workspaceSlug,
                projectId,
                issueId: meeting.id,
                projectIdentifier: getProjectIdentifierById(projectId),
                sequenceId: meeting.sequence_id,
              })}
              className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-body-xs-regular hover:bg-layer-1", {
                "text-tertiary line-through": meeting.state_group === "cancelled",
              })}
            >
              <KindIcon kind="meeting" />
              <span className="shrink-0 text-tertiary">{formatMeetingTime(meeting, timeZone, currentLocale)}</span>
              <span className="truncate text-primary">{meeting.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
});
