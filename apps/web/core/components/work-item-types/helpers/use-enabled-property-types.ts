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
import { useFlag } from "@/plane-web/hooks/store";

type TPropertyTypeEnabledOptions = {
  projectId?: string;
};

export const useIsPropertyTypeEnabled = (options?: TPropertyTypeEnabledOptions) => {
  const { workspaceSlug } = useParams();
  const isFormulaFieldEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TYPE_FORMULA_FIELD");
  // When options are provided (property creation context), formula requires a valid project context
  // (not available in templates). When options are not provided (value display context), only the flag is checked.
  const isFormulaAllowed = options ? isFormulaFieldEnabled && Boolean(options.projectId) : isFormulaFieldEnabled;

  return (key: string): boolean => {
    const flagMap: Record<string, boolean> = {
      FORMULA: isFormulaAllowed,
    };
    return flagMap[key] ?? true;
  };
};
