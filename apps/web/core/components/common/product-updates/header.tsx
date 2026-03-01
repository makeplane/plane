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
import { RefreshCw } from "lucide-react";
import { NewTabIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { InstanceService } from "@/services/instance.service";

const instanceService = new InstanceService();

export const ProductUpdatesHeader = observer(function ProductUpdatesHeader() {
  // states
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  // store hooks
  const { isUpdateAvailable, updateInstanceInfo } = useInstance();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true);
    instanceService
      .checkForUpdates()
      .then((response) => {
        updateInstanceInfo({
          current_version: response.current_version,
          latest_version: response.latest_version,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to check for updates",
        });
      })
      .finally(() => {
        setIsCheckingForUpdates(false);
      });
  };

  return (
    <div className="flex gap-2 mx-6 my-4 items-center justify-between shrink-0">
      <div className="flex w-full items-center">
        <div className="flex gap-2 text-18 font-medium">What&apos;s new</div>
        {isUpdateAvailable ? (
          <a
            tabIndex={-1}
            href="https://docs.plane.so/plane-one/self-host/manage/prime-cli"
            className={cn(
              "flex gap-1 items-center px-2 mx-2 py-0.5 text-center text-11 font-medium rounded-full bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-600"
            )}
            target="_blank"
            rel="noreferrer noopener"
          >
            Update available
            <NewTabIcon className="h-3 w-3" strokeWidth={2} />
          </a>
        ) : (
          <div
            className={cn(
              "px-2 mx-2 py-0.5 text-center text-11 font-medium rounded-full bg-accent-primary/20 text-accent-primary"
            )}
          >
            Latest
          </div>
        )}
        {isSelfManaged && !isUpdateAvailable && (
          <Button variant="ghost" className="font-medium outline-none px-1" onClick={handleCheckForUpdates}>
            Check for updates
            <RefreshCw size={10} className={cn("animate-spin", { "opacity-0": !isCheckingForUpdates })} />
          </Button>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-8">
        {isSelfManaged && subscriptionDetail?.product === EProductSubscriptionEnum.ONE && (
          <div className="cursor-default rounded-md bg-success-subtle px-2 py-0.5 text-center text-11 font-medium text-success-primary outline-none leading-6">
            Perpetual license
          </div>
        )}
      </div>
    </div>
  );
});
