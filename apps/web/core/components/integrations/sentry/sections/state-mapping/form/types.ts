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

import type { TSentryStateMapping } from "@plane/etl/sentry";
import type { ExState } from "@plane/sdk";

/**
 * Interface for Sentry State Mapping Form Props
 */
export interface StateMappingFormProps {
  modal: boolean;
  handleSubmit: (projectId: string, resolvedState: ExState, unresolvedState: ExState) => Promise<void>;
  stateMapping?: TSentryStateMapping;
  handleModal: (modal: boolean) => void;
  availableProjects: string[];
}

/**
 * Interface for Sentry State Mapping Form Data
 */
export interface SentryStateMappingFormData {
  projectId: string;
  resolvedState: ExState | null;
  unresolvedState: ExState | null;
}

/**
 * Interface for State Mapping Form Content Props
 */
export interface StateMappingFormContentProps {
  value: SentryStateMappingFormData;
  availableProjects: string[];
  handleChange: <T extends keyof SentryStateMappingFormData>(key: T, value: SentryStateMappingFormData[T]) => void;
  isEditMode: boolean;
}
