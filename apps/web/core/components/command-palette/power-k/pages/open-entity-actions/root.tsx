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

// types
import type { TPowerKOpenEntityActionsProps } from "@/components/power-k/ui/pages/open-entity/shared";
// local imports
import { PowerKOpenCustomersMenu } from "./customers-menu";
import { PowerKOpenInitiativesMenu } from "./initiatives-menu";
import { PowerKOpenTeamspacesMenu } from "./teamspaces-menu";

export function PowerKOpenEntityActionsExtended(props: TPowerKOpenEntityActionsProps) {
  const { activePage, handleSelection } = props;

  return (
    <>
      {activePage === "open-teamspace" && <PowerKOpenTeamspacesMenu handleSelect={handleSelection} />}
      {activePage === "open-initiative" && <PowerKOpenInitiativesMenu handleSelect={handleSelection} />}
      {activePage === "open-customer" && <PowerKOpenCustomersMenu handleSelect={handleSelection} />}
    </>
  );
}
