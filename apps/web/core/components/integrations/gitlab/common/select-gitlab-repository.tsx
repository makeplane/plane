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
// components
import { useTranslation } from "@plane/i18n";
// assets
import GitlabLogo from "@/app/assets/services/gitlab.svg?url";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";

type TSelectGitlabRepository = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
  excludeGitlabRepositoryIds?: string[];
};

export const SelectGitlabRepository = observer(function SelectGitlabRepository(props: TSelectGitlabRepository) {
  // props
  const { value, handleChange, isEnterprise, excludeGitlabRepositoryIds } = props;

  // hooks
  const { t } = useTranslation();
  const {
    data: { gitlabEntityIds, gitlabEntityById },
  } = useGitlabIntegration(isEnterprise);

  // derived values
  const repositories = (gitlabEntityIds || [])
    .map((id) => {
      const entity = gitlabEntityById(id);
      return entity;
    })
    .filter((entity) => entity !== undefined && entity !== null)
    .filter((repo) => !excludeGitlabRepositoryIds?.includes(repo?.id.toString() || ""));

  return (
    <>
      <div className="text-body-xs-regular text-secondary">Gitlab Repository</div>
      <Dropdown
        dropdownOptions={(repositories || [])?.map((repo) => ({
          key: repo?.id.toString() || "",
          label: repo?.name || "",
          value: repo?.id.toString() || "",
          data: repo,
        }))}
        value={value?.entityId || undefined}
        placeHolder={t("gitlab_integration.choose_repository")}
        onChange={(value: string | undefined) => handleChange("entityId", value || undefined)}
        iconExtractor={() => (
          <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
            <img src={GitlabLogo} alt="Gitlab Logo" className="w-full h-full object-cover" />
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
