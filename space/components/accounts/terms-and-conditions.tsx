import React, { FC } from "react";
import Link from "next/link";
import { EAuthModes } from "./auth-forms";

type Props = {
  mode: EAuthModes | null;
};

export const TermsAndConditions: FC<Props> = (props) => {
  const { mode } = props;
  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-sm text-onboarding-text-200 whitespace-pre-line">
        {mode
          ? mode === EAuthModes.SIGN_UP
            ? "By creating an account"
            : "By signing in"
          : "By clicking the above button"}
        , you agree to our{" \n"}
        <Link href="https://plane.so/legals/terms-and-conditions" target="_blank" rel="noopener noreferrer">
          <span className="text-sm font-medium underline hover:cursor-pointer">Terms of Service</span>
        </Link>{" "}
        and{" "}
        <Link href="https://plane.so/legals/privacy-policy" target="_blank" rel="noopener noreferrer">
          <span className="text-sm font-medium underline hover:cursor-pointer">Privacy Policy</span>
        </Link>
        {"."}
      </p>
    </span>
  );
};
