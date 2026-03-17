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
import useSWR from "swr";
import { MessageSquare } from "lucide-react";
import type { IFormattedInstanceConfiguration } from "@plane/types";
import { Switch } from "@plane/propel/switch";
// hooks
import { useInstance } from "@/hooks/store";

type TChatSupportConfig = {
  isTelemetryEnabled: boolean;
};

export const ChatSupportConfig = observer(function ChatSupportConfig(props: TChatSupportConfig) {
  const { isTelemetryEnabled } = props;
  // hooks
  const { instanceConfigurations, updateInstanceConfigurations, fetchInstanceConfigurations } = useInstance();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // derived values
  const isChatSupportEnabled = isTelemetryEnabled
    ? instanceConfigurations
      ? instanceConfigurations?.find((config) => config.key === "IS_CHAT_SUPPORT_ENABLED")?.value === "1"
        ? true
        : false
      : undefined
    : false;

  const { isLoading } = useSWR(isTelemetryEnabled ? "INSTANCE_CONFIGURATIONS" : null, () =>
    isTelemetryEnabled ? fetchInstanceConfigurations() : null
  );

  const initialLoader = isLoading && isChatSupportEnabled === undefined;

  const submitInstanceConfigurations = async (payload: Partial<IFormattedInstanceConfiguration>) => {
    try {
      await updateInstanceConfigurations(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enableChatSupportConfig = () => {
    void submitInstanceConfigurations({ IS_CHAT_SUPPORT_ENABLED: isChatSupportEnabled ? "0" : "1" });
  };

  return (
    <>
      <div className="flex items-center gap-14">
        <div className="grow flex items-center gap-4">
          <div className="shrink-0">
            <div className="flex items-center justify-center size-11 bg-layer-1 rounded-lg">
              <MessageSquare className="size-5 text-tertiary p-0.5" />
            </div>
          </div>

          <div className="grow">
            <div className="text-13 font-medium text-primary leading-5">Chat with us</div>
            <div className="text-11 font-regular text-tertiary leading-5">
              Let your users chat with us. Toggling Telemetry off turns this off automatically.
            </div>
          </div>

          <div className="ml-auto">
            <Switch
              value={isChatSupportEnabled ? true : false}
              onChange={enableChatSupportConfig}
              disabled={!isTelemetryEnabled || isSubmitting || initialLoader}
            />
          </div>
        </div>
      </div>
    </>
  );
});
