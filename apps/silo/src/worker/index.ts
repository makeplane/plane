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

import { CeleryProducer } from "./celery";
import { TaskManager } from "./manager";

export const importTaskManger = new TaskManager({
  workerTypes: {
    jira: "jira",
    linear: "linear",
    linear_docs: "linear_docs",
    asana: "asana",
    jira_server: "jira_server",
    flatfile: "flatfile",
    clickup: "clickup",
    clickup_additional_data: "clickup_additional_data",
    notion: "notion",
    confluence: "confluence",
  },
  retryAttempts: 3,
  retryDelay: 1000,
});

export const integrationTaskManager = new TaskManager({
  workerTypes: {
    "slack-interaction": "slack-interaction",
    "github-webhook": "github-webhook",
    "bitbucket-dc-webhook": "bitbucket-dc-webhook",
    "gitlab-webhook": "gitlab-webhook",
    "plane-github-webhook": "plane-github-webhook",
    "plane-bitbucket-dc-webhook": "plane-bitbucket-dc-webhook",
    "plane-gitlab-webhook": "plane-gitlab-webhook",
    "plane-slack-webhook": "plane-slack-webhook",
    "sentry-webhook": "sentry-webhook",
    "plane-sentry-webhook": "plane-sentry-webhook",
    "agent-webhook": "agent-webhook",
    "cursor-webhook": "cursor-webhook",
  },
  retryAttempts: 3,
  retryDelay: 1000,
});

export const celeryProducer = new CeleryProducer();
