import { FC } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// images
import GitlabLogo from "/public/logos/gitlab-logo.svg";

export type GitlabOAuthButtonProps = {
  text: string;
};

export const GitlabOAuthButton: FC<GitlabOAuthButtonProps> = (props) => {
  const { query } = useRouter();
  const { next_path } = query;
  const { text } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/gitlab/${next_path ? `?next_path=${next_path}` : ``}`);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image src={GitlabLogo} height={20} width={20} alt="GitLab Logo" />
      {text}
    </button>
  );
};
