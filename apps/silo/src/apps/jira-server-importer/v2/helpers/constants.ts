/**
 * SPDX-FileCopyrightText: 2026-present Plane Software, Inc.
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

export interface IKnownCustomFieldMatcher {
  names?: string[];
  customTypes?: string[];
}

export const KNOWN_CUSTOM_FIELDS = {
  EPIC_LINK: {
    names: ["Epic Link"],
    customTypes: ["com.pyxis.greenhopper.jira:gh-epic-link"],
  },
  START_DATE: {
    names: ["Start Date"],
  },
  COMPLETION_DATE: {
    names: ["Completion Date"],
  },
  SPRINT: {
    names: ["Sprint"],
    customTypes: ["com.pyxis.greenhopper.jira:gh-sprint"],
  },
  PARENT: {
    names: ["Parent Link"],
    customTypes: ["com.atlassian.jpo:jpo-custom-field-parent"],
  },
} as const satisfies Record<string, IKnownCustomFieldMatcher>;
