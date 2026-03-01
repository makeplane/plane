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

// plane web imports
import { PowerKOpenEntityActionsExtended } from "@/components/command-palette/power-k/pages/open-entity-actions/root";
// local imports
import { PowerKOpenProjectCyclesMenu } from "./project-cycles-menu";
import { PowerKOpenProjectModulesMenu } from "./project-modules-menu";
import { PowerKOpenProjectSettingsMenu } from "./project-settings-menu";
import { PowerKOpenProjectViewsMenu } from "./project-views-menu";
import { PowerKOpenProjectMenu } from "./projects-menu";
import type { TPowerKOpenEntityActionsProps } from "./shared";
import { PowerKOpenWorkspaceSettingsMenu } from "./workspace-settings-menu";
import { PowerKOpenWorkspaceMenu } from "./workspaces-menu";

export function PowerKOpenEntityPages(props: TPowerKOpenEntityActionsProps) {
  const { activePage, context, handleSelection } = props;

  return (
    <>
      {activePage === "open-workspace" && <PowerKOpenWorkspaceMenu handleSelect={handleSelection} />}
      {activePage === "open-project" && <PowerKOpenProjectMenu handleSelect={handleSelection} />}
      {activePage === "open-workspace-setting" && (
        <PowerKOpenWorkspaceSettingsMenu context={context} handleSelect={handleSelection} />
      )}
      {activePage === "open-project-setting" && (
        <PowerKOpenProjectSettingsMenu context={context} handleSelect={handleSelection} />
      )}
      {activePage === "open-project-cycle" && (
        <PowerKOpenProjectCyclesMenu context={context} handleSelect={handleSelection} />
      )}
      {activePage === "open-project-module" && (
        <PowerKOpenProjectModulesMenu context={context} handleSelect={handleSelection} />
      )}
      {activePage === "open-project-view" && (
        <PowerKOpenProjectViewsMenu context={context} handleSelect={handleSelection} />
      )}
      <PowerKOpenEntityActionsExtended {...props} />
    </>
  );
}
