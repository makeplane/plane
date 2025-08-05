import { FC } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

// helpers
import { API_BASE_URL } from "@plane/constants";

// images
import giteaLogo from "@/public/logos/gitea-logo.svg";

export type GiteaOAuthButtonProps = {
  text: string;
};

export const GiteaOAuthButton: FC<GiteaOAuthButtonProps> = ({ text }) => {
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next_path");

  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    const redirectUrl = `${API_BASE_URL}/auth/gitea/${next_path ? `?next_path=${next_path}` : ""}`;
    window.location.assign(redirectUrl);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image
        src={giteaLogo}
        height={20}
        width={20}
        alt="Gitea Logo"
      />
      {text}
    </button>
  );
};
