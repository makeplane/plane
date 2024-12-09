"use client";

import { FC } from "react";
import Link from "next/link";

export const MobileTermsAndConditions: FC = () => (
  <div className="flex items-center justify-center py-6">
    <div className="text-center text-sm text-onboarding-text-200 whitespace-pre-line">
      By signing in, you agree to our
      <br />
      <Link href="https://plane.so/legals/terms-and-conditions" target="_blank" rel="noopener noreferrer">
        <span className="text-sm font-medium underline hover:cursor-pointer">Terms of Service</span>
      </Link>
      &nbsp;and&nbsp;
      <Link href="https://plane.so/legals/privacy-policy" target="_blank" rel="noopener noreferrer">
        <span className="text-sm font-medium underline hover:cursor-pointer">Privacy Policy</span>
      </Link>
      .
    </div>
  </div>
);
