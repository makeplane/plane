/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TCapabilityAvailableState = {
  available: boolean;
};

export type TCapabilityConfiguredState = TCapabilityAvailableState & {
  configured: boolean;
  ready: boolean;
};

export type TCapabilityEnabledState = TCapabilityConfiguredState & {
  enabled: boolean;
};

export type TInstanceOAuthProviderCapability = TCapabilityEnabledState;

export type TInstanceProjectFeatureCapabilities = {
  cycles: TCapabilityAvailableState;
  modules: TCapabilityAvailableState;
  views: TCapabilityAvailableState;
  pages: TCapabilityAvailableState;
  intake: TCapabilityAvailableState;
};

export type TInstanceFeaturePolicy = {
  self_hosted: boolean;
  edition: string;
  commercial_gating: boolean;
  feature_tier: string;
  seat_limit: number | null;
  member_limit: number | null;
  project_limit: number | null;
};

export interface IInstanceCapabilities {
  ai: TCapabilityEnabledState;
  smtp: TCapabilityEnabledState;
  object_storage: TCapabilityConfiguredState;
  oauth: TCapabilityAvailableState & {
    providers: {
      google: TInstanceOAuthProviderCapability;
      github: TInstanceOAuthProviderCapability;
      gitlab: TInstanceOAuthProviderCapability;
      gitea: TInstanceOAuthProviderCapability;
    };
  };
  telemetry: TCapabilityAvailableState & {
    enabled: boolean;
  };
  public_projects: TCapabilityAvailableState & {
    enabled: boolean;
  };
  active_cycles: TCapabilityAvailableState & {
    enabled: boolean;
  };
  project_features: TInstanceProjectFeatureCapabilities;
  policy: TInstanceFeaturePolicy;
}
