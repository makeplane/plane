import { FC } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next_path") || undefined;
  const { text } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/spaces/gitlab/${nextPath ? `?next_path=${nextPath}` : ``}`);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F] bg-[#2F3135]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image src={GitlabLogo} height={20} width={20} alt="GitLab Logo" />
      {text}
    </button>
  );
};
