import { FC } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// images
import githubLightModeImage from "/public/logos/github-black.png";
import githubDarkModeImage from "/public/logos/github-dark.svg";

export type GithubOAuthButtonProps = {
  text: string;
};

export const GithubOAuthButton: FC<GithubOAuthButtonProps> = (props) => {
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next_path");
  const { text } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/github/${next_path ? `?next_path=${next_path}` : ``}`);
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
      {text}
    </button>
  );
};
