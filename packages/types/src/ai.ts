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

import type { IProjectLite } from "./project";
import type { IWorkspaceLite } from "./workspace";

export interface IGptResponse {
  response: string;
  response_html: string;
  count: number;
  project_detail: IProjectLite;
  workspace_detail: IWorkspaceLite;
}

export enum EAiFeedback {
  POSITIVE = "positive",
  NEGATIVE = "negative",
}

export type TAIBlockType = {
  key: string;
  label: string;
  description: string;
  has_content: boolean;
};

export type TAIBlockRevisionType = {
  key: string;
  label: string;
  description: string;
};

export type TAIBlockRevisionTypesResponse = {
  types: TAIBlockRevisionType[];
};

export type TAIBlockTypesResponse = {
  types: TAIBlockType[];
};

export type TAIBlockDetails = {
  block_id?: string;
  block_type: string;
  content: string | null;
  has_content: boolean;
  feedback: EAiFeedback | null;
  created_at?: string;
  updated_at?: string;
};

export type TAIBlockGenerateInputPartial = {
  block_id?: string;
  block_type: string;
  content?: string;
};
export type TAIBlockGenerateInput = TAIBlockGenerateInputPartial & {
  entity_type: string;
  entity_id: string | undefined;
  workspace_id: string | undefined;
  project_id: string | undefined;
};
export type TFeedback = {
  usage_type: string;
  usage_id: string;
  feedback: EAiFeedback;
  feedback_message?: string;
};

export type TAIBlockHandlers = {
  generateBlockContent: (data: TAIBlockGenerateInputPartial) => Promise<TAIBlockDetails>;
  revisionBlockContent: (data: { block_id: string; revision_type: string }) => Promise<{
    success: boolean;
    revised_content: string;
  }>;
  postFeedback: (data: TFeedback) => Promise<{
    success: boolean;
  }>;
  saveDocument?: () => Promise<void>;
};

export type PageUtilityEmbedResponse = {
  embed_id: string;
  embed_type: string;
  sub_type?: string | null;
  entity_type: string;
  entity_id: string;
  chat_id: string;
  message_id?: string | null;
  title?: string | null;
  payload: Record<string, unknown>;
};
