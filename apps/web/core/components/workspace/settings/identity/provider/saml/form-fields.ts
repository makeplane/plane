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

export const SAML_FORM_FIELDS = [
  {
    name: "entity_id" as const,
    label: "Entity ID",
    placeholder: "70a44354520df8bd9bcd",
    description: "A unique ID for this Plane app that you register on your IdP",
    required: true,
  },
  {
    name: "sso_url" as const,
    label: "SSO URL",
    placeholder: "https://example.com/sso",
    description: "The URL that brings up your IdP's authentication screen when your users click Continue with",
    required: true,
  },
  {
    name: "logout_url" as const,
    label: "Logout URL",
    placeholder: "https://example.com/logout",
    description: "Optional field that tells your IdP your users have logged out of this Plane app",
    required: false,
  },
  {
    name: "certificate" as const,
    label: "Certificate",
    placeholder: "---BEGIN CERTIFICATE---\n2yWn1gc7DhOFB9\nr0gbE+\n---END CERTIFICATE---",
    description: "IdP-generated certificate for signing this Plane app as an authorized service provider for your IdP",
    required: true,
    type: "textarea" as const,
  },
  {
    name: "disable_requested_authn_context" as const,
    label: "Disable RequestedAuthnContext to allow any authentication method",
    placeholder: "",
    description:
      "Enable this to fix Azure AD error AADSTS75011 when users authenticate with MFA, certificates, or other non-password methods",
    required: false,
    type: "toggle" as const,
  },
];
