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

export type TConnectorFormData = {
  name: string;
  description: string;
  url: string;
  authorization_type: string;
  headers?: { name: string; value: string }[];
  logo_url?: string;
  logo_asset?: string;
};

export type TConnector = {
  id: string;
  name: string;
  url: string;
  is_connected: boolean;
  is_configured: boolean;
  description_stripped: string;
  logo_asset: string | undefined;
  logo_url: string;
  authorization_type: string;
  status: string;
  metadata: Record<string, any>;
  sort_order: number;
  created_at: string;
  updated_at: string;
  slug: string;
  is_custom: boolean;
  /** When authorization_type is "header", returns configured headers; otherwise null */
  headers?: { name: string; value: string }[] | undefined;
};
