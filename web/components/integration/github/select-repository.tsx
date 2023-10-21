import React from "react";
import { useRouter } from "next/router";
import useSWRInfinite from "swr/infinite";
// services
import { ProjectService } from "services/project";
// ui
import { CustomSearchSelect } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegration } from "types";

type Props = {
  integration: IWorkspaceIntegration;
  value: any;
  label: string | JSX.Element;
  onChange: (repo: any) => void;
  characterLimit?: number;
};

const projectService = new ProjectService();

export const SelectRepository: React.FC<Props> = (props) => {
  const { integration, value, label, onChange, characterLimit = 25 } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const getKey = (pageIndex: number) => {
    if (!workspaceSlug || !integration) return;

    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/workspaces/${workspaceSlug}/workspace-integrations/${
      integration.id
    }/github-repositories/?page=${++pageIndex}`;
  };

  const fetchGithubRepos = async (url: string) => {
    const data = await projectService.getGithubRepositories(url);

    return data;
  };

  const { data: paginatedData, size, setSize, isValidating } = useSWRInfinite(getKey, fetchGithubRepos);

  let userRepositories = (paginatedData ?? []).map((data) => data.repositories).flat();
  userRepositories = userRepositories.filter((data) => data?.id);

  const totalCount = paginatedData && paginatedData.length > 0 ? paginatedData[0].total_count : 0;

  const options =
    userRepositories.map((repo) => ({
      value: repo.id,
      query: repo.full_name,
      content: <p>{truncateText(repo.full_name, characterLimit)}</p>,
    })) ?? [];

  if (userRepositories.length < 1) return null;

  return (
    <CustomSearchSelect
      value={value}
      options={options}
      onChange={(val: string) => {
        const repo = userRepositories.find((repo) => repo.id === val);

        onChange(repo);
      }}
      label={label}
      footerOption={
        <>
          {userRepositories && options.length < totalCount && (
            <button
              type="button"
              className="w-full p-1 text-center text-[0.6rem] text-custom-text-200 hover:bg-custom-background-80"
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
            >
              {isValidating ? "Loading..." : "Click to load more..."}
            </button>
          )}
        </>
      }
      optionsClassName="w-full"
    />
  );
};
