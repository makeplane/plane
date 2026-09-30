/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IProjectView } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  views: IProjectView[];
  onSelect: (view: IProjectView) => void;
};

export const PowerKViewsMenu = observer(function PowerKViewsMenu({ views, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <PowerKMenuBuilder
      items={views}
      getKey={(view) => view.id}
      getIcon={() => Layers}
      getValue={(view) => view.name}
      getLabel={(view) => view.name}
      onSelect={onSelect}
      emptyText={t("power_k_ui.empty_menu.views")}
    />
  );
});
