/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { EAuthModes, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@plane/constants";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

const MESSAGES = {
  [EAuthModes.SIGN_UP]: "By creating an account",
  [EAuthModes.SIGN_IN]: "By signing in",
} as const;

// Reusable link component to reduce duplication
function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-secondary" target="_blank" rel="noopener noreferrer">
      <span className="text-13 font-medium underline hover:cursor-pointer">{children}</span>
    </a>
  );
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  if (!TERMS_OF_SERVICE_URL && !PRIVACY_POLICY_URL) return null;

  return (
    <div className="flex items-center justify-center">
      <p className="text-center text-13 whitespace-pre-line text-tertiary">
        {`${MESSAGES[authType]}, you understand and agree to our `}
        {TERMS_OF_SERVICE_URL && <LegalLink href={TERMS_OF_SERVICE_URL}>Terms of Service</LegalLink>}
        {TERMS_OF_SERVICE_URL && PRIVACY_POLICY_URL && " and "}
        {PRIVACY_POLICY_URL && <LegalLink href={PRIVACY_POLICY_URL}>Privacy Policy</LegalLink>}.
      </p>
    </div>
  );
}
