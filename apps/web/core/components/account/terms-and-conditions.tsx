/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import Link from "next/link";
import { EAuthModes } from "@plane/constants";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

// Constants for better maintainability
const LEGAL_LINKS = {
  termsOfService: "https://gizmo.so/legals/terms-and-conditions",
  privacyPolicy: "https://gizmo.so/legals/privacy-policy",
} as const;

const MESSAGES = {
  [EAuthModes.SIGN_UP]: "Создавая учетную запись",
  [EAuthModes.SIGN_IN]: "Выполняя вход",
} as const;

// Reusable link component to reduce duplication
function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-secondary" target="_blank" rel="noopener noreferrer">
      <span className="text-13 font-medium underline hover:cursor-pointer">{children}</span>
    </Link>
  );
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  return (
    <div className="flex items-center justify-center">
      <p className="text-center text-13 whitespace-pre-line text-tertiary">
        {`${MESSAGES[authType]}, вы понимаете и принимаете \n наши `}
        <LegalLink href={LEGAL_LINKS.termsOfService}>Условия использования</LegalLink> и{" "}
        <LegalLink href={LEGAL_LINKS.privacyPolicy}>Политику конфиденциальности</LegalLink>.
      </p>
    </div>
  );
}
