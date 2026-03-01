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
// local imports
import { useWikiAppPowerKPageContextBasedActions } from "./page/commands";

export type ContextBasedActionsProps = {
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
  handleSelection: (data: unknown) => void;
};

export function WikiAppPowerKContextBasedPagesList(_props: ContextBasedActionsProps) {
  return <></>;
}

export const useWikiAppPowerKContextBasedActions = (): TPowerKCommandConfig[] => {
  const pageCommands = useWikiAppPowerKPageContextBasedActions();

  return [...pageCommands];
};
