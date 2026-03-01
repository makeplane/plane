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
import { InitiativeIcon } from "@plane/propel/icons";
// components
import { PowerKMenuBuilder } from "@/components/power-k/menus/builder";
// plane web imports
import type { TInitiative } from "@/types/initiative";

type Props = {
  initiatives: TInitiative[];
  onSelect: (initiative: TInitiative) => void;
};

export const PowerKInitiativesMenu = observer(function PowerKInitiativesMenu({ initiatives, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      heading="Initiatives"
      items={initiatives}
      getIconNode={(initiative) => (
        <>
          {initiative?.logo_props?.in_use ? (
            <Logo logo={initiative?.logo_props} size={14} type="lucide" />
          ) : (
            <InitiativeIcon className="size-3.5 text-tertiary" />
          )}
        </>
      )}
      getKey={(initiative) => initiative.id}
      getLabel={(initiative) => initiative.name}
      getValue={(initiative) => initiative.name}
      onSelect={onSelect}
      emptyText="No initiatives found"
    />
  );
});
