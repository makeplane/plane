"use client";

import React, { FC } from "react";
import Link from "next/link";
import { TERMS_URL, PRIVACY_URL } from "space/helpers/common.helper";

type Props = {
  isSignUp?: boolean;
};

export const TermsAndConditions: FC<Props> = (props) => {
  const { isSignUp = false } = props;
  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-sm text-onboarding-text-200 whitespace-pre-line">
        {isSignUp ? "By creating an account" : "By signing in"}, you agree to our{" \n"}
        <Link href={TERMS_URL} target="_blank" rel="noopener noreferrer">
          <span className="text-sm font-medium underline hover:cursor-pointer">
            Terms of Service
          </span>
        </Link>{" "}
        and{" "}
        <Link href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          <span className="text-sm font-medium underline hover:cursor-pointer">
            Privacy Policy
          </span>
        </Link>
        {"."}
      </p>
    </span>
  );
};
