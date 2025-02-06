"use client";

import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// images
import githubLightModeImage from "/public/logos/github-black.png";
import githubDarkModeImage from "/public/logos/github-dark.svg";

export type TGitHubAuthButton = {
  title: string;
};

export const GitHubAuthButton: FC<TGitHubAuthButton> = (props) => {
  // props
  const { title } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/mobile/github/`);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image
        src={resolvedTheme === "dark" ? githubDarkModeImage : githubLightModeImage}
        height={20}
        width={20}
        alt="GitHub Logo"
      />
      {title}
    </button>
  );
};
