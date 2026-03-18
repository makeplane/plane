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

import type { TWorkspaceConnection, TWorkspaceEntityConnection } from "../workspace";
import type { TStateMap } from "./common";

export type TBitbucketRepository = {
  id: number;
  slug: string;
  name: string;
  project: {
    key: string;
    name: string;
  };
};

export type TBitbucketEntityConnectionConfig = object & {
  states: { mergeRequestEventMapping?: TStateMap };
  allowBidirectionalSync?: boolean;
};

export type TBitbucketWorkspaceConnectionData = {
  baseUrl: string;
  user: {
    slug: string;
    id: string | number;
    displayName: string;
    emailAddress?: string | null;
    type?: string;
  };
  appConfig?: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    webhookSecret?: string;
  };
};

export type TBitbucketWorkspaceConnectionConfig = {
  userMap: Array<{ planeUser: { id: string }; bitbucketUser: { id: string | number; slug: string } }>;
};

export type TBitbucketWorkspaceConnection = TWorkspaceConnection<
  TBitbucketWorkspaceConnectionConfig,
  TBitbucketWorkspaceConnectionData
>;

export type TBitbucketEntityConnection = TWorkspaceEntityConnection<TBitbucketEntityConnectionConfig> & {
  entity_data: object & {
    id: number;
    slug: string;
    name: string;
    project: { key: string; name: string };
    webhookId?: number;
  };
};

export type TBitbucketUserCredential = {
  isConnected: boolean;
  displayName?: string;
  slug?: string;
};
