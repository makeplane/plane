"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// components
import { useTranslation } from "@plane/i18n";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TProjectMap } from "@/plane-web/types/integrations";
// public images
import GithubDarkLogo from "@/public/services/github-dark.svg";
import GithubLightLogo from "@/public/services/github-light.svg";

type TSelectGithubRepository = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
  excludeGithubRepositoryIds?: string[];
};

export const SelectGithubRepository: FC<TSelectGithubRepository> = observer((props) => {
  // props
  const { value, handleChange, isEnterprise, excludeGithubRepositoryIds } = props;

  // hooks
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const {
    data: { githubRepositoryIds, githubRepositoryById },
  } = useGithubIntegration(isEnterprise);

  // derived values
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;
  const repositories = (githubRepositoryIds || [])
    .map((id) => {
      const repository = githubRepositoryById(id);
      return repository;
    })
    .filter((repo) => repo !== undefined && repo !== null)
    .filter((repo) => !excludeGithubRepositoryIds?.includes(repo?.id.toString() || ""));

  return (
    <>
      <div className="text-sm text-custom-text-200">Github Repository</div>
      <Dropdown
        dropdownOptions={(repositories || [])?.map((repo) => ({
          key: repo?.id.toString() || "",
          label: repo?.name || "",
          value: repo?.id.toString() || "",
          data: repo,
        }))}
        value={value?.entityId || undefined}
        placeHolder={t("github_integration.choose_repository")}
        onChange={(value: string | undefined) => handleChange("entityId", value || undefined)}
        iconExtractor={() => (
          <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
            <Image src={githubLogo} layout="fill" objectFit="contain" alt="GitHub Logo" />
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
