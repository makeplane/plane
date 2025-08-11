import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { WORK_ITEM_TYPE_TRACKER_ELEMENTS, WORK_ITEM_TYPE_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
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
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/issue-types/issue-type", extension: "png" });

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
        captureSuccess({
          eventName: WORK_ITEM_TYPE_TRACKER_EVENTS.TYPES_ENABLED,
          payload: {
            project_id: projectId,
          },
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable work item types",
        });
        captureError({
          eventName: WORK_ITEM_TYPE_TRACKER_EVENTS.TYPES_ENABLED,
          payload: {
            project_id: projectId,
          },
          error: error as Error,
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
          className="!p-0 w-full"
          title=""
          description=""
          assetPath={resolvedPath}
          primaryButton={{
            text: t("work_item_types.empty_state.enable.primary_button.text"),
            onClick: () => {
              captureClick({
                elementName: WORK_ITEM_TYPE_TRACKER_ELEMENTS.HEADER_ENABLE_WORK_ITEM_TYPES_BUTTON,
              });
              setEnableIssueTypeConfirmation(true);
            },
          }}
          size="md"
        />
      );
    }

    if (isSelfManagedUpgradeDisabled) {
      return (
        <DetailedEmptyState
          className="!p-0 w-full"
          title=""
          description=""
          assetPath={resolvedPath}
          primaryButton={{
            text: t("work_item_types.empty_state.get_pro.primary_button.text"),
            onClick: () => window.open("https://prime.plane.so/", "_blank"),
          }}
          size="md"
        />
      );
    }

    return (
      <DetailedEmptyState
        className="!p-0 w-full"
        title=""
        description=""
        assetPath={resolvedPath}
        primaryButton={{
          text: t("work_item_types.empty_state.upgrade.primary_button.text"),
          onClick: () => togglePaidPlanModal(true),
        }}
        size="md"
      />
    );
  };

  return (
    <div className="w-full">
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
    </div>
  );
});
