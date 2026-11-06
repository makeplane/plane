/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { AiStarFourOutline, PlusCircleOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { useTranslation } from "@plane/i18n";
// components
import { AgentPicker } from "@/components/agents/agent-picker";
import { AgentModelSelect } from "@/components/agents/model-select";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAgentChat } from "@/hooks/store/use-agent-chat";

export const WorkspaceAgentsHeader = observer(function WorkspaceAgentsHeader() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { snapshot, startNewSession } = useAgentChat();
  const slug = workspaceSlug?.toString();
  const canStartNew = snapshot?.status === "ready" && !snapshot.prompting;

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("agents.title")}
                  icon={<AiStarFourOutline className="size-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {snapshot && (
          <Button
            variant="ghost"
            size="md"
            stretch="auto"
            icon={<PlusCircleOutline />}
            label={t("agents.sessions.new")}
            disabled={!canStartNew}
            onClick={() => void startNewSession()}
          />
        )}
        <AgentModelSelect />
        {slug && <AgentPicker workspaceSlug={slug} />}
      </Header.RightItem>
    </Header>
  );
});
