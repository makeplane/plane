/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ExternalCallLogTable } from "@/components/research/integrations/external-call-log-table";
import { ExternalReferencePicker } from "@/components/research/integrations/external-reference-picker";
import { IntegrationConnectionForm } from "@/components/research/integrations/integration-connection-form";
import { IntegrationHealthBoard } from "@/components/research/integrations/integration-health-board";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
};

/** Administrator integration console: connections, health, references, logs. */
export const IntegrationSettings = observer(function IntegrationSettings({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      await research.fetchIntegrations(workspaceSlug).catch(() => undefined);
      await Promise.all([
        research.fetchIntegrationHealth(workspaceSlug).catch(() => undefined),
        research.fetchExternalReferences(workspaceSlug).catch(() => undefined),
        research.fetchIntegrationCallLogs(workspaceSlug).catch(() => undefined),
      ]);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-13 font-medium text-primary">{t("research.integrations.connections_title")}</h3>
        <IntegrationConnectionForm
          connections={research.integrationConnections}
          onSave={async (items) => {
            await research.updateIntegrations(
              workspaceSlug,
              items as Parameters<typeof research.updateIntegrations>[1]
            );
          }}
        />
        <IntegrationHealthBoard connections={research.integrationConnections} health={research.integrationHealth} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-13 font-medium text-primary">{t("research.integrations.references_title")}</h3>
        <ExternalReferencePicker workspaceSlug={workspaceSlug} />
      </section>

      {loaded && research.isWorkspaceAdmin && (
        <section className="flex flex-col gap-2">
          <h3 className="text-13 font-medium text-primary">{t("research.integrations.call_logs_title")}</h3>
          <ExternalCallLogTable logs={research.integrationCallLogs} />
        </section>
      )}
    </div>
  );
});
