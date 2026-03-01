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

import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
// plane imports
import { Avatar } from "@plane/propel/avatar";
import { IconButton } from "@plane/propel/icon-button";
import type { EAgentRunStatus } from "@plane/types";
import { Breadcrumbs, Header, Loader } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { AgentRunStatus } from "./run-status";

type TProps = {
  agentUser: string;
  agentStatus: EAgentRunStatus;
  isLoading: boolean;
  toggleSidePanel: (value: boolean) => void;
};
export const AgentHeader = observer(function AgentHeader(props: TProps) {
  const { agentUser, agentStatus, isLoading, toggleSidePanel } = props;
  // hooks
  const router = useRouter();
  const { getUserDetails } = useMember();
  // derived values
  const userDetails = getUserDetails(agentUser);
  const avatarUrl = userDetails?.avatar_url;

  return (
    <AppHeader
      showToggleButton={false}
      header={
        <Header>
          <Header.LeftItem className="flex items-center gap-2">
            <Breadcrumbs onBack={router.back}>
              <Breadcrumbs.Item
                component={
                  isLoading ? (
                    <Loader className="flex items-center gap-2">
                      <Loader.Item className="w-4 h-4 rounded-full" width="16px" height="16px" />
                      <Loader.Item width="100px" height="20px" />
                    </Loader>
                  ) : (
                    <div className="flex rounded-sm gap-2 items-center">
                      <div className="shrink-0">
                        <Avatar size="sm" name={userDetails?.display_name} src={getFileURL(avatarUrl ?? "")} />
                      </div>
                      <span className="text-body-sm-medium text-primary my-auto">{userDetails?.display_name}</span>
                      <span className="text-caption-sm-regular text-placeholder">Agent</span>
                    </div>
                  )
                }
              />
            </Breadcrumbs>
          </Header.LeftItem>
          <Header.RightItem>
            {agentStatus && <AgentRunStatus status={agentStatus} />}
            <IconButton variant="ghost" size="lg" icon={X} onClick={() => toggleSidePanel(false)} />
          </Header.RightItem>
        </Header>
      }
    />
  );
});
