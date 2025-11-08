"use client";

import { observer } from "mobx-react";

/**
 * Active Cycles upgrade component disabled - feature available to all users
 * This component previously showed an upgrade prompt for workspace active cycles
 */
export const WorkspaceActiveCyclesUpgrade = observer(() => {
  // Active cycles feature now available - no upgrade required
  return null;
});
