/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Trans } from "@plane/i18n";

type Props = {
  isSignUp?: boolean;
};

export function TermsAndConditions(props: Props) {
  const { isSignUp = false } = props;
  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-13 whitespace-pre-line text-secondary">
        <Trans
          i18nKey={isSignUp ? "space_public.terms_sign_up" : "space_public.terms_sign_in"}
          components={{
            tos: (
              <a
                href="https://plane.so/legals/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-13 font-medium underline hover:cursor-pointer"
              />
            ),
            privacy: (
              <a
                href="https://plane.so/legals/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-13 font-medium underline hover:cursor-pointer"
              />
            ),
          }}
        />
      </p>
    </span>
  );
}
