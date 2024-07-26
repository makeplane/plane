"use client";

import { FC, ReactNode } from "react";
// helpers
import { EAuthModes } from "@/types/auth";

type TAuthHeader = {
  authMode: EAuthModes;
  children: ReactNode;
};

type TAuthHeaderContent = {
  header: string;
  subHeader: string;
};

type TAuthHeaderDetails = {
  [mode in EAuthModes]: TAuthHeaderContent;
};

const Titles: TAuthHeaderDetails = {
  [EAuthModes.SIGN_IN]: {
    header: "Sign in to upvote or comment",
    subHeader: "Contribute in nudging the features you want to get built.",
  },
  [EAuthModes.SIGN_UP]: {
    header: "View, comment, and do more",
    subHeader: "Sign up or log in to work with Plane Issues and Pages.",
  },
};

export const AuthHeader: FC<TAuthHeader> = (props) => {
  const { authMode, children } = props;

  const getHeaderSubHeader = (mode: EAuthModes | null): TAuthHeaderContent => {
    if (mode) {
      return Titles[mode];
    }

    return {
      header: "Comment or react to issues",
      subHeader: "Use plane to add your valuable inputs to features.",
    };
  };

  const { header, subHeader } = getHeaderSubHeader(authMode);

  return (
    <>
      <div className="space-y-1 text-center">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-onboarding-text-100">{header}</h3>
        <p className="text-xs sm:text-sm md:text-base font-medium text-onboarding-text-400">{subHeader}</p>
      </div>
      {children}
    </>
  );
};
