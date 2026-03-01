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

// integration types
export enum E_INTEGRATION_KEYS {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  SLACK = "SLACK",
  SENTRY = "SENTRY",
  PRD_AGENT = "PRD_AGENT",
  DRAWIO = "DRAWIO",
  MERMAID = "MERMAID",
  GITHUB_ENTERPRISE = "GITHUB_ENTERPRISE",
  GITLAB_ENTERPRISE = "GITLAB_ENTERPRISE",
  RUNNER = "RUNNER",
}
export type TIntegrationKeys = keyof typeof E_INTEGRATION_KEYS;

export enum E_ENTITY_CONNECTION_KEYS {
  SLACK_USER = "SLACK-USER",
  GITHUB_USER = "GITHUB-USER",
  GITLAB_USER = "GITLAB-USER",
  PRD_AGENT_USER = "PRD_AGENT-USER",
  SENTRY_USER = "SENTRY-USER",
}

export type TEntityConnectionKeys = keyof typeof E_ENTITY_CONNECTION_KEYS;
