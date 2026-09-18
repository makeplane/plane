/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TUserProfile = {
  id: string | undefined;

  user: string | undefined;
  role: string | undefined;
  last_workspace_id: string | undefined;

  theme: {
    theme: string | undefined;
  };

  onboarding_step: {
    workspace_join: boolean;
    profile_complete: boolean;
    workspace_create: boolean;
    workspace_invite: boolean;
  };
  is_onboarded: boolean;
  is_tour_completed: boolean;

  use_case: string | undefined;

  billing_address_country: string | undefined;
  billing_address: string | undefined;
  has_billing_address: boolean;
  has_marketing_email_consent: boolean;

  created_at: Date | string;
  updated_at: Date | string;
};
