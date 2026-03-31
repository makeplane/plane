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
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsMainContentActionsRoot } from "./actions/root";
import { AutomationDetailsMainContentHeader } from "./header/root";
import { AutomationDetailsMainContentLoader } from "./loader";
// import { AutomationDetailsMainContentScopeRoot } from "./scope/root";
import { AutomationDetailsMainContentTriggerRoot } from "./trigger/root";

type TProps = {
  automationId: string;
  isLoaded: boolean;
};

export const AutomationDetailsMainContentRoot = observer(function AutomationDetailsMainContentRoot(props: TProps) {
  const { automationId, isLoaded } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);

  return (
    <main className="@container shrink-0 grow flex justify-center px-page-x py-6 overflow-y-scroll vertical-scrollbar scrollbar-sm">
      <div className="w-full @sm:w-4/5 @4xl:w-3/5 space-y-6">
        {isLoaded ? (
          <>
            <AutomationDetailsMainContentHeader automationId={automationId} />
            {/* <AutomationDetailsMainContentScopeRoot automationId={automationId} /> */}
            {automation?.scope && <AutomationDetailsMainContentTriggerRoot automationId={automationId} />}
            {automation?.isTriggerNodeAvailable && (
              <AutomationDetailsMainContentActionsRoot automationId={automationId} />
            )}
          </>
        ) : (
          <AutomationDetailsMainContentLoader />
        )}
      </div>
    </main>
  );
});
