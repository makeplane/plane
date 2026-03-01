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

// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
import type { ContextBasedActionsProps, TContextEntityMap } from "@/components/power-k/ui/pages/context-based";
// local imports
import type { TPowerKContextTypeExtended } from "../../types";
import { PowerKInitiativeContextBasedPages } from "./initiative";
import { usePowerKInitiativeContextBasedActions } from "./initiative/commands";

export const CONTEXT_ENTITY_MAP_EXTENDED: Record<TPowerKContextTypeExtended, TContextEntityMap> = {
  initiative: {
    i18n_title: "power_k.contextual_actions.initiative.title",
    i18n_indicator: "power_k.contextual_actions.initiative.indicator",
  },
};

export function PowerKContextBasedActionsExtended(props: ContextBasedActionsProps) {
  const { activeContext, activePage, handleSelection } = props;

  return (
    <>
      {activeContext === "initiative" && (
        <PowerKInitiativeContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
    </>
  );
}

export const usePowerKContextBasedExtendedActions = (): TPowerKCommandConfig[] => {
  const initiativeCommands = usePowerKInitiativeContextBasedActions();

  return [...initiativeCommands];
};
