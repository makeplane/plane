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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CircleAlert, CircleCheck, RefreshCw } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
// hooks
import { useSelfHostedSubscription } from "@/plane-web/hooks/store/use-self-hosted-subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";

type TLicenseSyncStatus = "synced" | "syncing" | "success" | "error";

export const SelfManagedSyncButton = observer(function SelfManagedSyncButton() {
  // router
  const { workspaceSlug } = useParams();
  // states
  const [licenseSyncStatus, setLicenseSyncStatus] = useState<TLicenseSyncStatus>("synced");

  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { syncLicense } = useSelfHostedSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  const handleSyncLicense = async () => {
    setLicenseSyncStatus("syncing");
    try {
      await syncLicense(workspaceSlug.toString());
      setLicenseSyncStatus("success");
    } catch {
      setLicenseSyncStatus("error");
    } finally {
      setTimeout(() => {
        setLicenseSyncStatus("synced");
      }, 3000);
    }
  };

  if (!isSelfManaged) return null;
  return (
    <Button variant="secondary" size="lg" onClick={handleSyncLicense} disabled={licenseSyncStatus !== "synced"}>
      {licenseSyncStatus === "synced" && "Sync plan"}
      {licenseSyncStatus === "syncing" && (
        <>
          <RefreshCw size={12} className={cn("shrink-0 mt-0.5 animate-spin transition-all duration-700")} />
          Syncing
        </>
      )}
      {licenseSyncStatus === "success" && (
        <>
          <CircleCheck size={12} className="shrink-0 mt-0.5 transition-all duration-300 animate-in zoom-in-50" />
          Synced
        </>
      )}
      {licenseSyncStatus === "error" && (
        <>
          <CircleAlert size={12} className="shrink-0 mt-0.5 transition-all duration-300 animate-in zoom-in-50" />
          Sync error
        </>
      )}
    </Button>
  );
});
