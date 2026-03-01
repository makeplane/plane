/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// components
import { useTranslation } from "@plane/i18n";
// assets
import GithubDarkLogo from "@/app/assets/services/github-dark.svg?url";
import GithubLightLogo from "@/app/assets/services/github-light.svg?url";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";

type TSelectGithubRepository = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
  excludeGithubRepositoryIds?: string[];
};

export const SelectGithubRepository = observer(function SelectGithubRepository(props: TSelectGithubRepository) {
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
      <div className="text-body-xs-regular text-secondary">Github Repository</div>
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
            <img src={githubLogo} alt="GitHub Logo" className="w-full h-full object-cover" />
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
