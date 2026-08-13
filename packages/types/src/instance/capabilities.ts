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
  project_features: TInstanceProjectFeatureCapabilities;
}
