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
import type { TPowerKContextType } from "@/components/power-k/core/types";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type TArgs = {
  activeContext: TPowerKContextType | null;
};

export const useExtendedContextIndicator = (args: TArgs): string | null => {
  const { activeContext } = args;
  // navigation
  const { initiativeId } = useParams();
  // store hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  // derived values
  let indicator: string | undefined | null = null;

  switch (activeContext) {
    case "initiative": {
      const initiativeDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : null;
      indicator = initiativeDetails?.name;
      break;
    }
    default: {
      indicator = null;
      break;
    }
  }

  return indicator ?? null;
};
