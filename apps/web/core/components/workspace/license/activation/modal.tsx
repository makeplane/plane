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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { LicenseFileForm } from "./license-file-form";
import { LicenseKeyForm } from "./license-key-form";

type TSubscriptionActivationModal = {
  isOpen: boolean;
  handleClose: () => void;
};

export const SubscriptionActivationModal = observer(function SubscriptionActivationModal(
  props: TSubscriptionActivationModal
) {
  const { isOpen, handleClose } = props;
  // params
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { handleSuccessModalToggle } = useWorkspaceSubscription();
  const { config } = useInstance();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const currentWorkspaceLogoUrl = currentWorkspace?.logo_url ? getFileURL(currentWorkspace?.logo_url) : undefined;
  const isAirGapped = config?.is_airgapped;
  const hasActivateLicensePermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  const handleSuccess = useCallback(
    (message: string) => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: message || "Workspace subscription activated successfully.",
      });
      handleSuccessModalToggle(true);
      handleClose();
    },
    [handleClose, handleSuccessModalToggle]
  );

  const commonProps = useMemo(
    () => ({
      workspaceSlug: workspaceSlug?.toString(),
      hasPermission: hasActivateLicensePermission,
      onSuccess: handleSuccess,
      handleClose,
    }),
    [workspaceSlug, handleSuccess, handleClose, hasActivateLicensePermission]
  );

  if (!isOpen) return null;
  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.XXXL} position={EModalPosition.CENTER} className="rounded-xl">
      <div className="py-4 bg-surface-1 rounded-lg space-y-4">
        <div className="px-4 space-y-2">
          <h3 className="flex items-center whitespace-nowrap flex-wrap gap-2 text-16 font-medium">
            Activate
            <div className="flex flex-shrink-0 items-center gap-2 truncate">
              <WorkspaceLogo logo={currentWorkspaceLogoUrl} name={currentWorkspace?.name} />
            </div>
            {currentWorkspace?.name}
          </h3>
          <div className="text-13 font-medium text-tertiary">
            {isAirGapped
              ? "Upload a license file to activate the plan you subscribed to on this workspace. Any other workspaces without a license key on this instance will continue to be on the Free plan."
              : "Enter a license key to activate the plan you subscribed to on this workspace. Any other workspaces without a license key on this instance will continue to be on the Free plan."}
          </div>
        </div>
        {isAirGapped ? <LicenseFileForm {...commonProps} /> : <LicenseKeyForm {...commonProps} />}
      </div>
    </ModalCore>
  );
});
