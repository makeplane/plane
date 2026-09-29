/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContrastIcon } from "@plane/propel/icons";
import type { ICycle } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  cycles: ICycle[];
  onSelect: (cycle: ICycle) => void;
  value?: string | null;
};

export const PowerKCyclesMenu = observer(function PowerKCyclesMenu({ cycles, onSelect, value }: Props) {
  const { t } = useTranslation();

  return (
    <PowerKMenuBuilder
      items={cycles}
      getIcon={() => ContrastIcon}
      getKey={(cycle) => cycle.id}
      getValue={(cycle) => cycle.name}
      getLabel={(cycle) => cycle.name}
      isSelected={(cycle) => value === cycle.id}
      onSelect={onSelect}
      emptyText={t("power_k_ui.empty_menu.cycles")}
    />
  );
});
