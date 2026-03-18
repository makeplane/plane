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

import { observer } from "mobx-react";
import BitbucketLogo from "@/app/assets/services/bitbucket.svg?url";
import { Dropdown } from "@/components/importers/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import type { TProjectMap } from "@/types/integrations";

type TSelectBitbucketRepository = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  excludeRepositoryIds?: string[];
};

export const SelectBitbucketRepository = observer(function SelectBitbucketRepository({
  value,
  handleChange,
  excludeRepositoryIds,
}: TSelectBitbucketRepository) {
  const {
    data: { bitbucketRepositoryIds, bitbucketRepositoryById },
  } = useBitbucketDCIntegration();

  const repositories = (bitbucketRepositoryIds || [])
    .map((id) => bitbucketRepositoryById(id))
    .filter((repo) => repo != null)
    .filter((repo) => !excludeRepositoryIds?.includes(repo.id.toString()));

  return (
    <>
      <div className="text-body-xs-regular text-secondary">Bitbucket Repository</div>
      <Dropdown
        dropdownOptions={repositories.map((repo) => ({
          key: repo.id.toString(),
          label: `${repo.project.key}/${repo.name}`,
          value: repo.id.toString(),
          data: repo,
        }))}
        value={value?.entityId ?? undefined}
        placeHolder="Choose a repository"
        onChange={(val: string | undefined) => handleChange("entityId", val)}
        iconExtractor={() => (
          <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
            <img src={BitbucketLogo} alt="Bitbucket Logo" className="w-full h-full object-cover" />
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
