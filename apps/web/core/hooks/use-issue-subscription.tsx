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

import useSWR from "swr";
import { IssueSubscriberService } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

import { useUser } from "./store/user";
import { useCallback, useState } from "react";
import { useTranslation } from "@plane/i18n";

const issueSubscriberService = new IssueSubscriberService();

export const useIssueSubscription = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  issueId: string | undefined
) => {
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  // swr hooks
  const { data: subscribers, mutate: mutateSubscribers } = useSWR<string[]>(
    workspaceSlug && projectId && issueId ? `ISSUES_SUBSCRIBERS_${issueId}` : null,
    workspaceSlug && projectId && issueId ? () => issueSubscriberService.list(workspaceSlug, projectId, issueId) : null
  );
  // derived values
  const isSubscribed = subscribers?.find((subscriber) => subscriber === currentUser?.id) ? true : false;

  const handleSubscription = useCallback(async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    setLoading(true);
    try {
      if (isSubscribed) await issueSubscriberService.unsubscribe(workspaceSlug, projectId, issueId);
      else await issueSubscriberService.subscribe(workspaceSlug, projectId, issueId);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isSubscribed
          ? t("issue.subscription.actions.unsubscribed")
          : t("issue.subscription.actions.subscribed"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    } finally {
      mutateSubscribers();
      setLoading(false);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscribed, projectId, workspaceSlug, issueId, mutateSubscribers]);

  return {
    loading,
    isSubscribed,
    subscribers: subscribers ?? [],
    mutateSubscribers,
    handleSubscription,
  };
};
