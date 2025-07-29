import React from "react";
import Link from "next/link";
import { EAuthModes } from "@plane/constants";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

// Constants for better maintainability
const LEGAL_LINKS = {
  termsOfService: "https://plane.so/legals/terms-and-conditions",
  privacyPolicy: "https://plane.so/legals/privacy-policy",
} as const;

const MESSAGES = {
  [EAuthModes.SIGN_UP]: "By creating an account",
  [EAuthModes.SIGN_IN]: "By signing in",
} as const;

// Reusable link component to reduce duplication
const LegalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link href={href} className="text-custom-text-200" target="_blank" rel="noopener noreferrer">
    <span className="text-sm font-medium underline hover:cursor-pointer">{children}</span>
  </Link>
);

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ authType = EAuthModes.SIGN_IN }) => (
  <div className="flex items-center justify-center">
    <p className="text-center text-sm text-custom-text-300 whitespace-pre-line">
      {`${MESSAGES[authType]}, you understand and agree to \n our `}
      <LegalLink href={LEGAL_LINKS.termsOfService}>Terms of Service</LegalLink> and{" "}
      <LegalLink href={LEGAL_LINKS.privacyPolicy}>Privacy Policy</LegalLink>.
    </p>
  </div>
);
