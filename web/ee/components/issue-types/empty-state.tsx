import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueTypeEmptyState: FC<TIssueTypeEmptyState> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { enableIssueTypes } = useIssueTypes();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [enableIssueTypeConfirmation, setEnableIssueTypeConfirmation] = useState<boolean>(false);
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;
  // derived values
  const isIssueTypeSettingsEnabled = useFlag(workspaceSlug, "ISSUE_TYPES");
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/issue-types/issue-type", extension: "svg" });
  // handlers
  const handleEnableIssueTypes = async () => {
    setIsLoading(true);
    await enableIssueTypes(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work item types and custom properties are now enabled for this project",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable work item types",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getEmptyStateContent = () => {
    if (isIssueTypeSettingsEnabled) {
      return (
        <DetailedEmptyState
          title={t("work_item_types.empty_state.enable.title")}
          description={t("work_item_types.empty_state.enable.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("work_item_types.empty_state.enable.primary_button.text"),
            onClick: () => setEnableIssueTypeConfirmation(true),
          }}
        />
      );
    }

    if (isSelfManagedUpgradeDisabled) {
      return (
        <DetailedEmptyState
          title={t("work_item_types.empty_state.get_pro.title")}
          description={t("work_item_types.empty_state.get_pro.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("work_item_types.empty_state.get_pro.primary_button.text"),
            onClick: () => window.open("https://prime.plane.so/", "_blank"),
          }}
        />
      );
    }

    return (
      <DetailedEmptyState
        title={t("work_item_types.empty_state.upgrade.title")}
        description={t("work_item_types.empty_state.upgrade.description")}
        assetPath={resolvedPath}
        primaryButton={{
          text: t("work_item_types.empty_state.upgrade.primary_button.text"),
          onClick: () => togglePaidPlanModal(true),
        }}
      />
    );
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={enableIssueTypeConfirmation}
        handleClose={() => setEnableIssueTypeConfirmation(false)}
        handleSubmit={() => handleEnableIssueTypes()}
        isSubmitting={isLoading}
        title={t("work_item_types.empty_state.enable.confirmation.title")}
        content={
          <>
            {t("work_item_types.empty_state.enable.confirmation.description")}
            <a
              href="https://docs.plane.so/core-concepts/issues/issue-types"
              target="_blank"
              className="font-medium hover:underline"
            >
              {` ${t("common.read_the_docs")}`}
            </a>
            .
          </>
        }
        primaryButtonText={{
          loading: t("work_item_types.empty_state.enable.confirmation.button.loading"),
          default: t("work_item_types.empty_state.enable.confirmation.button.default"),
        }}
        secondaryButtonText={t("common.cancel")}
      />
      {getEmptyStateContent()}
    </>
  );
});
