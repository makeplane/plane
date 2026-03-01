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
// components
import type { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "@/components/power-k/core/types";
import { PowerKModalDefaultPage } from "@/components/power-k/ui/pages/default";
import { PowerKAccountPreferencesPages } from "@/components/power-k/ui/pages/preferences";

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
  onPageDataSelect: (value: unknown) => void;
};

export const PlaneAiAppPowerKModalPagesList = observer(function PlaneAiAppPowerKModalPagesList(props: Props) {
  const { activePage, context, onCommandSelect, onPageDataSelect } = props;

  // Main page content (no specific page)
  if (!activePage) {
    return <PowerKModalDefaultPage context={context} onCommandSelect={onCommandSelect} />;
  }

  return (
    <>
      <PowerKAccountPreferencesPages activePage={activePage} handleSelection={onPageDataSelect} />
    </>
  );
});
