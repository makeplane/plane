import Image from "next/image";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import GithubDarkLogo from "@/public/services/github-dark.svg";
import GithubLightLogo from "@/public/services/github-light.svg";

export const GithubHeader = () => {
  // hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;
  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90/50 p-4">
      <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
        <Image src={githubLogo} layout="fill" objectFit="contain" alt="GitHub Logo" />
      </div>
      <div>
        <div className="text-lg font-medium">GitHub</div>
        <div className="text-sm text-custom-text-200">{t("github_integration.description")}</div>
      </div>
    </div>
  );
};
