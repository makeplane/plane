/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useSWRConfig } from "swr";
// plane imports
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
// components
import { PROJECT_SETTINGS_ICONS } from "@/components/settings/project/sidebar/item-icon";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const WorkItemTypesEmptyState = observer(function WorkItemTypesEmptyState(props: Props) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { enableIssueTypes } = useIssueTypes();
  // swr
  const { mutate } = useSWRConfig();
  // translation
  const { t } = useTranslation();
  // states
  const [isEnabling, setIsEnabling] = useState(false);

  const Icon = PROJECT_SETTINGS_ICONS.work_item_types;

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await enableIssueTypes(workspaceSlug, projectId);
      await mutate(PROJECT_ISSUE_TYPES(workspaceSlug, projectId));
      setToast({
        type: "success",
        title: t("work_item_types.enable_disable.toast.success.title"),
        message: "Work item types enabled successfully.",
      });
    } catch {
      setToast({
        type: "error",
        title: t("work_item_types.enable_disable.toast.error.title"),
        message: t("work_item_types.enable_disable.toast.error.message", { action: "enable" }),
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center py-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-md border border-subtle bg-layer-1 p-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-md bg-layer-2">
          <Icon className="size-5 text-secondary" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-16 font-medium text-primary">{t("work_item_types.empty_state.enable.title")}</h3>
          <p className="text-13 text-tertiary">{t("work_item_types.empty_state.enable.description")}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          loading={isEnabling}
          label={
            isEnabling
              ? t("work_item_types.empty_state.enable.confirmation.button.loading")
              : t("work_item_types.empty_state.enable.primary_button.text")
          }
          onClick={() => {
            void handleEnable();
          }}
        />
      </div>
    </div>
  );
});
