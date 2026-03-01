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

import { createContext } from "react";
// react-hook-form
import type { UseFormReset } from "react-hook-form";
// plane imports
import type { TProject } from "@plane/types";

export type THandleTemplateChangeProps = {
  workspaceSlug: string;
  reset: UseFormReset<TProject>;
};

export type TProjectCreationContext = {
  projectTemplateId: string | null;
  setProjectTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
  isApplyingTemplate: boolean;
  setIsApplyingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  handleTemplateChange: (props: THandleTemplateChangeProps) => Promise<void>;
};

export const ProjectCreationContext = createContext<TProjectCreationContext | undefined>(undefined);
