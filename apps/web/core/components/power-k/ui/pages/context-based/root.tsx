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
import type { TPowerKCommandConfig, TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";
// plane web imports
import {
  PowerKContextBasedActionsExtended,
  usePowerKContextBasedExtendedActions,
} from "@/components/command-palette/power-k/pages/context-based";
// local imports
import { usePowerKCycleContextBasedActions } from "./cycle/commands";
import { PowerKModuleContextBasedPages } from "./module";
import { usePowerKModuleContextBasedActions } from "./module/commands";
import { usePowerKPageContextBasedActions } from "./page/commands";
import { PowerKWorkItemContextBasedPages } from "./work-item";
import { usePowerKWorkItemContextBasedCommands } from "./work-item/commands";

export type ContextBasedActionsProps = {
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
  handleSelection: (data: unknown) => void;
};

export function PowerKContextBasedPagesList(props: ContextBasedActionsProps) {
  const { activeContext, activePage, handleSelection } = props;

  return (
    <>
      {activeContext === "work-item" && (
        <PowerKWorkItemContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
      {activeContext === "module" && (
        <PowerKModuleContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
      <PowerKContextBasedActionsExtended {...props} />
    </>
  );
}

export const usePowerKContextBasedActions = (): TPowerKCommandConfig[] => {
  const workItemCommands = usePowerKWorkItemContextBasedCommands();
  const cycleCommands = usePowerKCycleContextBasedActions();
  const moduleCommands = usePowerKModuleContextBasedActions();
  const pageCommands = usePowerKPageContextBasedActions();
  const extendedCommands = usePowerKContextBasedExtendedActions();

  return [...workItemCommands, ...cycleCommands, ...moduleCommands, ...pageCommands, ...extendedCommands];
};
