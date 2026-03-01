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

import type {
  IPartialProject,
  TProjectAttributes as TProjectAttributesExport,
  TProjectAttributesParams as TProjectAttributesParamsExport,
  TProjectAttributesResponse as TProjectAttributesResponseExport,
  TProject as TProjectExport,
  TProjectFeaturesList as TProjectFeaturesListExport,
  TProjectFeatures as TProjectFeaturesExport,
} from "@plane/types";

// Re-exporting from here to avoid import changes in other files
// TODO: Remove this once all the imports are updated

export type TPartialProject = IPartialProject;

export type TProjectAttributes = TProjectAttributesExport;

export type TProjectAttributesParams = TProjectAttributesParamsExport;

export type TProjectAttributesResponse = TProjectAttributesResponseExport;

export type TProject = TProjectExport;

export type TProjectFeaturesList = TProjectFeaturesListExport;

export type TProjectFeatures = TProjectFeaturesExport;
