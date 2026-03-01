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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TTeamspace } from "@plane/types";
import { PowerKMenuBuilder } from "@/components/power-k/menus/builder";

type Props = {
  teamspaces: TTeamspace[];
  onSelect: (teamspace: TTeamspace) => void;
};

export const PowerKTeamspacesMenu = observer(function PowerKTeamspacesMenu({ teamspaces, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      heading="Teamspaces"
      items={teamspaces}
      getIconNode={(teamspace) => <Logo logo={teamspace.logo_props} size={14} />}
      getKey={(teamspace) => teamspace.id}
      getLabel={(teamspace) => teamspace.name}
      getValue={(teamspace) => teamspace.name}
      onSelect={onSelect}
      emptyText="No teamspaces found"
    />
  );
});
