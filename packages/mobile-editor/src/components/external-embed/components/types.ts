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

export type EmbedLinkStorage = {
  isModalOpen: boolean;
  posToInsert: { from: number; to: number };
  url: string;
};

export interface IframelyResponse {
  error?: string;
  code?: string;
  html?: string;
  meta?: {
    title?: string;
    description?: string;
    medium?: string;
    keywords?: string;
    canonical?: string;
  };
  links?: {
    thumbnail?: Array<{
      href: string;
      type: string;
      rel: string[];
      media?: {
        width: number;
        height: number;
      };
    }>;
    icon?: Array<{
      href: string;
      rel: string[];
      type: string;
      media?: {
        width: number;
        height: number;
      };
    }>;
  };
  rel?: string[];
}
