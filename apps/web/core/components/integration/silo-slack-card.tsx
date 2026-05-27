/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { CheckCircle } from "lucide-react";

import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

import SlackLogo from "@/app/assets/services/slack.png?url";
import { useUser } from "@/hooks/store/user/user-user";
import { useUserPermissions } from "@/hooks/store/user";
import { SiloIntegrationService } from "@/services/integrations";

const silo = new SiloIntegrationService();

const SWR_KEY = (slug: string) => `silo-connections-slack:${slug}`;

export const SiloSlackCard = observer(function SiloSlackCard() {
  const { workspaceSlug } = useParams() as { workspaceSlug: string };
  const userStore = useUser();
  const currentUser = userStore.data;
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const [isInstalling, setIsInstalling] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);

  const { data: connections } = useSWR(workspaceSlug ? SWR_KEY(String(workspaceSlug)) : null, () =>
    silo.listConnections(String(workspaceSlug), "slack")
  );

  const installed = connections && connections.length > 0 ? connections[0] : null;

  const handleInstall = async () => {
    if (!isAdmin || !currentUser) return;
    setIsInstalling(true);
    try {
      const url = await silo.getSlackInstallUrl(String(workspaceSlug), currentUser.id);
      window.location.assign(url);
    } catch (e) {
      setIsInstalling(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Slack connect failed",
        message: (e as Error).message,
      });
    }
  };

  const handleUninstall = async () => {
    if (!isAdmin || !installed) return;
    setIsUninstalling(true);
    try {
      await silo.deleteConnection(String(workspaceSlug), installed.id);
      await mutate(SWR_KEY(String(workspaceSlug)));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Slack disconnected",
        message: "Workspace install removed.",
      });
    } catch (e) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Disconnect failed",
        message: (e as Error).message,
      });
    } finally {
      setIsUninstalling(false);
    }
  };

  return (
    <div className="border-b border-subtle bg-surface-1">
      <div className="flex items-center justify-between gap-2 px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 flex-shrink-0">
            <img src={SlackLogo} className="h-full w-full object-cover" alt="Slack" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-body-xs-medium">
              Slack
              {installed ? <CheckCircle className="h-3.5 w-3.5 fill-transparent text-success-primary" /> : null}
            </h3>
            <p className="text-body-xs-regular text-secondary">
              {installed
                ? `Connected to ${installed.connection_slug || installed.connection_id}.`
                : "Connect Slack to sync work items with channels."}
            </p>
          </div>
        </div>
        {installed ? (
          <Button variant="error-fill" onClick={handleUninstall} disabled={!isAdmin} loading={isUninstalling}>
            {isUninstalling ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleInstall} disabled={!isAdmin} loading={isInstalling}>
            {isInstalling ? "Redirecting..." : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
});
