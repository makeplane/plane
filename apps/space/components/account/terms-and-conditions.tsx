/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@plane/constants";

type Props = {
  isSignUp?: boolean;
};

export function TermsAndConditions(props: Props) {
  const { isSignUp = false } = props;
  if (!TERMS_OF_SERVICE_URL && !PRIVACY_POLICY_URL) return null;

  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-13 whitespace-pre-line text-secondary">
        {isSignUp ? "By creating an account" : "By signing in"}, you agree to our{" "}
        {TERMS_OF_SERVICE_URL && (
          <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer">
            <span className="text-13 font-medium underline hover:cursor-pointer">Terms of Service</span>
          </a>
        )}
        {TERMS_OF_SERVICE_URL && PRIVACY_POLICY_URL && " and "}
        {PRIVACY_POLICY_URL && (
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
            <span className="text-13 font-medium underline hover:cursor-pointer">Privacy Policy</span>
          </a>
        )}
        .
      </p>
    </span>
  );
}
