"use client";

import React, { FC } from "react";
import Link from "next/link";

type Props = {
  isSignUp?: boolean;
};

export const TermsAndConditions: FC<Props> = (props) => {
  const { isSignUp = false } = props;
  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-sm text-onboarding-text-200 whitespace-pre-line">
        <Link href="https://www.explorers.com" target="_blank" rel="noopener noreferrer">
          <span className="text-sm font-medium underline hover:cursor-pointer">Powered by Explorers</span>
        </Link>
        {"."}
      </p>
    </span>
  );
};
