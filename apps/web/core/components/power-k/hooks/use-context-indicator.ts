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

import { useParams } from "next/navigation";
// plane imports
import { getPageName } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useModule } from "@/hooks/store/use-module";
// plane web imports
import { useExtendedContextIndicator } from "@/components/command-palette/power-k/hooks/use-extended-context-indicator";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import type { TPowerKContextType } from "../core/types";

type TArgs = {
  activeContext: TPowerKContextType | null;
};

export const useContextIndicator = (args: TArgs): string | null => {
  const { activeContext } = args;
  // navigation
  const { workItem: workItemIdentifier, cycleId, moduleId, pageId } = useParams();
  // store hooks
  const { getCycleById } = useCycle();
  const { getModuleById } = useModule();
  const { getPageById } = usePageStore(EPageStoreType.PROJECT);
  // extended context indicator
  const extendedIndicator = useExtendedContextIndicator({
    activeContext,
  });
  let indicator: string | undefined | null = null;

  switch (activeContext) {
    case "work-item": {
      indicator = workItemIdentifier ? workItemIdentifier.toString() : null;
      break;
    }
    case "cycle": {
      const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : null;
      indicator = cycleDetails?.name;
      break;
    }
    case "module": {
      const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : null;
      indicator = moduleDetails?.name;
      break;
    }
    case "page": {
      const pageInstance = pageId ? getPageById(pageId.toString()) : null;
      indicator = getPageName(pageInstance?.name);
      break;
    }
    default: {
      indicator = extendedIndicator;
    }
  }

  return indicator ?? null;
};
