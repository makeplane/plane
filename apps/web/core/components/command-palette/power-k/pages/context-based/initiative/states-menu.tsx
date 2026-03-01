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

import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane imports
import { INITIATIVE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InitiativeStateIcon } from "@plane/propel/icons";
import type { TInitiativeStates } from "@plane/types";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";

type Props = {
  handleSelect: (data: TInitiativeStates) => void;
  value: TInitiativeStates;
};

export const PowerKInitiativeStatesMenu = observer(function PowerKInitiativeStatesMenu(props: Props) {
  const { handleSelect, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <Command.Group>
      {Object.values(INITIATIVE_STATES).map((state) => (
        <PowerKModalCommandItem
          key={state.key}
          iconNode={<InitiativeStateIcon state={state.key} className="size-3.5 shrink-0" />}
          label={t(state.title)}
          isSelected={state.key === value}
          onSelect={() => handleSelect(state.key)}
        />
      ))}
    </Command.Group>
  );
});
