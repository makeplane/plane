/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Button } from "@makeplane/propel/components/button";
import { Select } from "@plane/blocks/select";
import type { IGithubRepository, IWorkspaceIntegration } from "@plane/types";
// helpers
import { truncateText } from "@plane/utils";
import { ProjectService } from "@/services/project";
// types

type Props = {
  integration: IWorkspaceIntegration;
  value: any;
  label: string | React.ReactNode;
  onChange: (repo: any) => void;
  characterLimit?: number;
};

const projectService = new ProjectService();

export function SelectRepository(props: Props) {
  const { integration, value, label, onChange, characterLimit = 25 } = props;
  // router
  const { workspaceSlug } = useParams();

  const getKey = (pageIndex: number) => {
    if (!workspaceSlug || !integration) return;

    return `${process.env.VITE_API_BASE_URL}/api/workspaces/${workspaceSlug}/workspace-integrations/${
      integration.id
    }/github-repositories/?page=${++pageIndex}`;
  };

  const fetchGithubRepos = async (url: string) => {
    const data = await projectService.getGithubRepositories(url);

    return data;
  };

  const { data: paginatedData, size, setSize, isValidating } = useSWRInfinite(getKey, fetchGithubRepos);

  let userRepositories = (paginatedData ?? []).flatMap((data) => data.repositories);
  userRepositories = userRepositories.filter((data) => data?.id);

  const totalCount = paginatedData && paginatedData.length > 0 ? paginatedData[0].total_count : 0;

  if (userRepositories.length < 1) return null;

  // derived values
  // `value` has carried either the repository id or its `owner/name` full name.
  const selectedRepository = userRepositories.find((repo) => repo.id === value || repo.full_name === value) ?? null;

  return (
    <Select<IGithubRepository>
      getValues={() => userRepositories}
      value={selectedRepository}
      onChange={(val) => {
        const repo = userRepositories.find((repository) => repository.id === val);

        onChange(repo);
      }}
      getOptionValue={(repo) => repo.id}
      getOptionLabel={(repo) => truncateText(repo.full_name, characterLimit)}
      getOptionSearchText={(repo) => repo.full_name}
      footer={
        userRepositories.length < totalCount ? (
          <Button
            variant="ghost"
            size="xs"
            stretch="full"
            onClick={() => void setSize(size + 1)}
            disabled={isValidating}
            label={isValidating ? "Loading..." : "Click to load more..."}
          />
        ) : undefined
      }
    >
      <Select.Trigger<IGithubRepository> variant="select-md">{label}</Select.Trigger>
    </Select>
  );
}
