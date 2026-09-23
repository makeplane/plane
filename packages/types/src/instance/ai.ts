/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TInstanceAIConfigurationKeys = "LLM_API_KEY" | "LLM_MODEL";

export type TAIProviderProtocol = "openai_compatible";

export interface IAIModelProfile {
  id: string;
  model_id: string;
  display_name: string;
  enabled: boolean;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

export interface IAIProviderProfile {
  id: string;
  name: string;
  slug: string;
  protocol: TAIProviderProtocol;
  base_url: string;
  organization_id: string;
  project_id: string;
  default_model: string;
  enabled: boolean;
  is_default: boolean;
  timeout_seconds: number;
  max_retries: number;
  temperature: number | null;
  top_p: number | null;
  max_output_tokens: number | null;
  model_profiles: IAIModelProfile[];
  has_api_key: boolean;
  api_key_hint: string;
  last_tested_at: string | null;
  last_test_success: boolean | null;
  last_test_error_code: string;
  created_at: string;
  updated_at: string;
}

export type TAIProviderCreate = Omit<
  IAIProviderProfile,
  | "id"
  | "model_profiles"
  | "has_api_key"
  | "api_key_hint"
  | "last_tested_at"
  | "last_test_success"
  | "last_test_error_code"
  | "created_at"
  | "updated_at"
> & { api_key?: string };

export type TAIProviderUpdate = Partial<TAIProviderCreate> & { clear_api_key?: boolean };

export interface IAIProviderConnectionTestResult {
  success: boolean;
  model: string;
  provider_status?: string;
  error_code?: string;
}

/**
 * Body of the draft connection test: the provider fields the admin form holds
 * before anything is saved. Only base_url and a model are required. When
 * provider_id names a saved provider, a blank api_key means "use the stored one".
 */
export interface IAIProviderDraftTestPayload {
  base_url: string;
  api_key?: string;
  model?: string;
  default_model?: string;
  organization_id?: string;
  project_id?: string;
  timeout_seconds?: number;
  max_retries?: number;
  provider_id?: string;
}
