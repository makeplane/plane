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

import { useCallback, useState } from "react";
import useSWR from "swr";
import { IssueSubscriberService } from "@plane/services";
import { useUser } from "./store/user";

const issueSubscriberService = new IssueSubscriberService();

type IssueSubscriptionValues = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  issueId: string | undefined;
};
export const useIssueSubscription = (values: IssueSubscriptionValues) => {
  const { workspaceSlug, projectId, issueId } = values;
  const [loading, setLoading] = useState(false);
  // hooks
  const { data: currentUser } = useUser();
  // swr hooks
  const { data: subscribers, mutate: mutateSubscribers } = useSWR<string[]>(
    workspaceSlug && projectId && issueId ? `ISSUES_SUBSCRIBERS_${issueId}` : null,
    workspaceSlug && projectId && issueId ? () => issueSubscriberService.list(workspaceSlug, projectId, issueId) : null
  );
  // derived values
  const isSubscribed = subscribers?.find((subscriber) => subscriber === currentUser?.id) ? true : false;
  const subscribersCount = subscribers?.length ?? 0;

  const handleSubscription = useCallback(async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    setLoading(true);
    if (isSubscribed) await issueSubscriberService.unsubscribe(workspaceSlug, projectId, issueId);
    else await issueSubscriberService.subscribe(workspaceSlug, projectId, issueId);
    mutateSubscribers();
    setLoading(false);
  }, [isSubscribed, projectId, workspaceSlug, issueId, mutateSubscribers]);

  const handleSubscribers = useCallback(
    async (subscriberIds: string[]) => {
      if (!workspaceSlug || !projectId || !issueId) return;
      try {
        mutateSubscribers(subscriberIds, false);
        await issueSubscriberService.update(workspaceSlug, projectId, issueId, subscriberIds);
      } catch (_error: any) {
        mutateSubscribers();
      }
    },
    [workspaceSlug, projectId, issueId, mutateSubscribers]
  );

  return {
    loading,
    isSubscribed,
    subscribersCount,
    subscribers: subscribers ?? [],
    handleSubscription,
    handleSubscribers,
  };
};
