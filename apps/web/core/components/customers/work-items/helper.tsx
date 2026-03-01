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

import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// helper
import { copyTextToClipboard } from "@plane/utils";
// hooks
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
        } catch (_error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: entityName }),
          });
        }
      },
      removeRelation: async (workspaceSlug: string, customerId: string, workItemId: string, requestId?: string) => {
        try {
          return removeWorkItemFromCustomer(workspaceSlug, customerId, workItemId, requestId).then((response) => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("customers.toasts.work_item.remove.success.title"),
              message: t("customers.toasts.work_item.remove.success.message"),
            });
            return response;
          });
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("customers.toasts.work_item.remove.error.title"),
            message: t("customers.toasts.work_item.remove.error.message"),
          });
        }
      },
    }),
    [entityName, removeWorkItemFromCustomer, updateIssue, t]
  );

  return issueOperations;
};
