/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// plane imports
import { getPageName } from "@plane/utils";
// hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";
import { useCycle } from "@/hooks/store/use-cycle";
import { useModule } from "@/hooks/store/use-module";
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
      indicator = null;
    }
  }

  return indicator ?? null;
};
