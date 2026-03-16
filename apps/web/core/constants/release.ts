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

import { RELEASE_STATES } from "@plane/constants";
import type { CreateUpdateReleaseModal } from "@plane/types";

export const DEFAULT_CREATE_UPDATE_RELEASE_MODAL_DATA: CreateUpdateReleaseModal = {
  isOpen: false,
  releaseId: undefined,
};

export const DEFAULT_RELEASE_STATE = RELEASE_STATES.unreleased.key;
