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
// plane imports
import { Spinner } from "@plane/ui";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";
// local imports
import { PowerKInitiativesMenu } from "../../menus/initiatives";

type Props = {
  handleSelect: (initiative: TInitiative) => void;
};

export const PowerKOpenInitiativesMenu = observer(function PowerKOpenInitiativesMenu(props: Props) {
  const { handleSelect } = props;
  // store hooks
  const {
    initiative: { initiativesLoader, initiativeIds, getInitiativeById },
  } = useInitiatives();
  // derived values
  const initiativesList = initiativeIds
    ? initiativeIds.map((initiativeId) => getInitiativeById(initiativeId)).filter((initiative) => !!initiative)
    : [];

  if (initiativesLoader) return <Spinner />;

  return <PowerKInitiativesMenu initiatives={initiativesList} onSelect={handleSelect} />;
});
