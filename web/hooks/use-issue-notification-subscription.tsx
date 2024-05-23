import { useCallback } from "react";
import useSWR from "swr";
import { IUser, TUserProfile } from "@plane/types";
// services
import { NotificationService } from "@/services/notification.service";
// types

const userNotificationServices = new NotificationService();

const useUserIssueNotificationSubscription = (
  user: IUser | null,
  profile: TUserProfile | undefined,
  workspaceSlug?: string | string[] | null,
  projectId?: string | string[] | null,
  issueId?: string | string[] | null
) => {
  const { data, error, mutate } = useSWR(
    workspaceSlug && projectId && issueId ? `SUBSCRIPTION_STATUE_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? () =>
          userNotificationServices.getIssueNotificationSubscriptionStatus(
            workspaceSlug.toString(),
            projectId.toString(),
            issueId.toString()
          )
      : null
  );

  const handleUnsubscribe = useCallback(() => {
    if (!workspaceSlug || !projectId || !issueId) return;

    mutate(
      {
        subscribed: false,
      },
      false
    );

    userNotificationServices
      .unsubscribeFromIssueNotifications(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      .then(() => {
        mutate({
          subscribed: false,
        });
      });
  }, [workspaceSlug, projectId, issueId, mutate]);

  const handleSubscribe = useCallback(() => {
    if (!workspaceSlug || !projectId || !issueId || !user) return;

    mutate(
      {
        subscribed: true,
      },
      false
    );

    userNotificationServices
      .subscribeToIssueNotifications(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      .then(() => {
        mutate({
          subscribed: true,
        });
      });
  }, [workspaceSlug, projectId, issueId, mutate, user]);

  return {
    loading: !data && !error,
    subscribed: data?.subscribed,
    handleSubscribe,
    handleUnsubscribe,
  } as const;
};

export default useUserIssueNotificationSubscription;
