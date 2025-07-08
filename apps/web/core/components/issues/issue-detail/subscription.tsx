"use client";

import { FC, useState } from "react";
import isNil from "lodash/isNil";
import { observer } from "mobx-react";
import { Bell, BellOff } from "lucide-react";
// plane-i18n
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// UI
import { EIssueServiceType } from "@plane/types";
import { Button, Loader, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useIssueDetail, useUserPermissions } from "@/hooks/store";

export type TIssueSubscription = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  serviceType?: EIssueServiceType;
};

export const IssueSubscription: FC<TIssueSubscription> = observer((props) => {
  const { workspaceSlug, projectId, issueId, serviceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // hooks
  const {
    subscription: { getSubscriptionByIssueId },
    createSubscription,
    removeSubscription,
  } = useIssueDetail(serviceType);
  // state
  const [loading, setLoading] = useState(false);
  // hooks
  const { allowPermissions } = useUserPermissions();

  const isSubscribed = getSubscriptionByIssueId(issueId);
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const handleSubscription = async () => {
    setLoading(true);
    try {
      if (isSubscribed) await removeSubscription(workspaceSlug, projectId, issueId);
      else await createSubscription(workspaceSlug, projectId, issueId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isSubscribed
          ? t("issue.subscription.actions.unsubscribed")
          : t("issue.subscription.actions.subscribed"),
      });
      setLoading(false);
    } catch {
      setLoading(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    }
  };

  if (isNil(isSubscribed))
    return (
      <Loader>
        <Loader.Item width="106px" height="28px" />
      </Loader>
    );

  return (
    <div>
      <Button
        size="sm"
        prependIcon={isSubscribed ? <BellOff /> : <Bell className="h-3 w-3" />}
        variant="outline-primary"
        className="hover:!bg-custom-primary-100/20"
        onClick={handleSubscription}
        disabled={!isEditable || loading}
      >
        {loading ? (
          <span>
            <span className="hidden sm:block">{t("common.loading")}</span>
          </span>
        ) : isSubscribed ? (
          <div className="hidden sm:block">{t("common.actions.unsubscribe")}</div>
        ) : (
          <div className="hidden sm:block">{t("common.actions.subscribe")}</div>
        )}
      </Button>
    </div>
  );
});
