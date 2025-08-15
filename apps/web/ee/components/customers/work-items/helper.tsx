"use client";
import { useMemo } from "react";
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssue, TIssueServiceType } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// helper
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useCustomers } from "@/plane-web/hooks/store";

export type TCustomerWorkItemOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeRelation: (workspaceSlug: string, customerId: string, workItemId: string, requestId?: string) => Promise<void>;
};

export const useCustomerWorkItemOperations = (
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TCustomerWorkItemOperations => {
  const { updateIssue } = useIssueDetail(issueServiceType);
  const {
    workItems: { removeWorkItemFromCustomer },
  } = useCustomers();
  const { t } = useTranslation();
  // derived values
  const entityName = issueServiceType === EIssueServiceType.ISSUES ? "Work item" : "Epic";

  const issueOperations: TCustomerWorkItemOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}${text}`).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.link_copied"),
            message: t("entity.link_copied_to_clipboard", { entity: entityName }),
          });
        });
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.update.success", { entity: entityName }),
          });
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: entityName }),
          });
        }
      },
      removeRelation: async (workspaceSlug: string, customerId: string, workItemId: string, requestId?: string) => {
        try {
          return removeWorkItemFromCustomer(workspaceSlug, customerId, workItemId, requestId).then(() => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.remove_work_items_from_customer,
              payload: {
                id: customerId,
              },
            });
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("customers.toasts.work_item.remove.success.title"),
              message: t("customers.toasts.work_item.remove.success.message"),
            });
          });
        } catch (error) {
          captureError({
            eventName: CUSTOMER_TRACKER_EVENTS.remove_work_items_from_customer,
            payload: {
              id: customerId,
            },
            error: error as Error,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("customers.toasts.work_item.remove.error.title"),
            message: t("customers.toasts.work_item.remove.error.message"),
          });
        }
      },
    }),
    [entityName, removeWorkItemFromCustomer, updateIssue]
  );

  return issueOperations;
};
