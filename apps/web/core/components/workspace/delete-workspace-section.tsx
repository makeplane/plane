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

import { CircleAlert } from "lucide-react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IWorkspace } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { DeleteWorkspaceModal } from "./delete-workspace-modal";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection = observer(function DeleteWorkspaceSection(props: TDeleteWorkspace) {
  const { workspace } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const [activeSubscriptionModal, setActiveSubscriptionModal] = useState(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isAnySubscriptionActive = !currentWorkspaceSubscribedPlanDetail?.can_delete_workspace;
  // translation
  const { t } = useTranslation();

  const handleDeleteWorkspace = () => {
    if (isAnySubscriptionActive) {
      setActiveSubscriptionModal(true);
    } else {
      setDeleteWorkspaceModal(true);
    }
  };

  return (
    <>
      <ModalCore
        isOpen={activeSubscriptionModal}
        handleClose={() => setActiveSubscriptionModal(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XL}
      >
        <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <span
            className={cn(
              "shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-accent-primary/20 text-accent-primary"
            )}
          >
            <CircleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="text-center sm:text-left">
            <h3 className="text-16 font-medium">Cancel your subscription first.</h3>
            <p className="mt-1 text-13 text-secondary">
              {" "}
              You have an active subscription to one of our paid plans. Please go{" "}
              <Link
                href={`/${workspaceSlug}/settings/billing`}
                className="text-accent-secondary underline font-semibold"
              >
                here
              </Link>{" "}
              to cancel it first, then come back here to proceed.
            </p>
          </div>
        </div>
        <div className="px-5 pb-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={() => setActiveSubscriptionModal(false)}>
            Close
          </Button>
        </div>
      </ModalCore>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.general.delete_workspace")}
        description="Tread carefully here. You delete your workspace, you lose all your data, your members can't access projects and pages, and we can't retrieve any of it for you. Proceed only if you are sure you want your workspace deleted."
        control={
          <Button variant="error-outline" onClick={handleDeleteWorkspace}>
            {t("delete")}
          </Button>
        }
      />
    </>
  );
});
