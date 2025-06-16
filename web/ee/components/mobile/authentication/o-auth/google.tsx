"use client";

import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { API_BASE_URL  } from "@plane/constants";
// images
import GoogleLogo from "/public/logos/google-logo.svg";

export type TGoogleAuthButton = {
  title: string;
  invitationId?: string;
};

export const GoogleAuthButton: FC<TGoogleAuthButton> = (props) => {
  // props
  const { title, invitationId } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    let url = `${API_BASE_URL}/auth/mobile/google/`;
    if (invitationId) url += `?invitation_id=${invitationId}`;
    window.location.assign(url);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image src={GoogleLogo} height={18} width={18} alt="Google Logo" />
      {title}
    </button>
  );
};
