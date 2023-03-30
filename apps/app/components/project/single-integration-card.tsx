import React, { useState } from "react";

import Image from "next/image";

import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";

// headless ui
import { Combobox, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
// hooks
import { useRouter } from "next/router";
import useToast from "hooks/use-toast";
// icons
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import GithubLogo from "public/logos/github-square.png";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegrations } from "types";
// fetch-keys
import { PROJECT_GITHUB_REPOSITORY } from "constants/fetch-keys";

type Props = {
  integration: IWorkspaceIntegrations;
};

export const SingleIntegration: React.FC<Props> = ({ integration }) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { data: syncedGithubRepository } = useSWR(
    projectId ? PROJECT_GITHUB_REPOSITORY(projectId as string) : null,
    () =>
      workspaceSlug && projectId && integration
        ? projectService.getProjectGithubRepository(
            workspaceSlug as string,
            projectId as string,
            integration.id
          )
        : null
  );

  const getKey = (pageIndex: number) => {
    if (!workspaceSlug || !integration) return;

    return `${
      process.env.NEXT_PUBLIC_API_BASE_URL
    }/api/workspaces/${workspaceSlug}/workspace-integrations/${
      integration.id
    }/github-repositories/?page=${++pageIndex}`;
  };

  const fetchGithubRepos = async (url: string) => {
    const data = await projectService.getGithubRepositories(url);

    return data;
  };

  const {
    data: paginatedData,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(getKey, fetchGithubRepos);

  const handleChange = (repo: any) => {
    if (!workspaceSlug || !projectId || !integration) return;

    const {
      html_url,
      owner: { login },
      id,
      name,
    } = repo;

    projectService
      .syncGiuthubRepository(workspaceSlug as string, projectId as string, integration.id, {
        name,
        owner: login,
        repository_id: id,
        url: html_url,
      })
      .then((res) => {
        console.log(res);
        mutate(PROJECT_GITHUB_REPOSITORY(projectId as string));

        setToastAlert({
          type: "success",
          title: "Success!",
          message: `${login}/${name} respository synced with the project successfully.`,
        });
      })
      .catch((err) => {
        console.log(err);

        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Respository could not be synced with the project. Please try again.",
        });
      });
  };

  const userRepositories = (paginatedData ?? []).map((data) => data.repositories).flat();
  const totalCount = paginatedData && paginatedData.length > 0 ? paginatedData[0].total_count : 0;

  const options =
    userRepositories.map((repo) => ({
      value: repo.id,
      query: repo.full_name,
      content: <p>{truncateText(repo.full_name, 25)}</p>,
    })) ?? [];

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {integration && (
        <div className="flex items-center justify-between gap-2 rounded-[10px] border bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 flex-shrink-0">
              <Image src={GithubLogo} alt="GithubLogo" />
            </div>
            <div>
              <h3 className="flex items-center gap-4 text-xl font-semibold">
                {integration.integration_detail.title}
              </h3>
              <p className="text-sm text-gray-400">Select GitHub repository to enable sync.</p>
            </div>
          </div>
          <Combobox
            as="div"
            value={
              syncedGithubRepository && syncedGithubRepository.length > 0
                ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                : null
            }
            onChange={(val: string) => {
              const repo = userRepositories.find((repo) => repo.id === val);

              handleChange(repo);
            }}
            className="relative flex-shrink-0 text-left"
          >
            {({ open }: any) => (
              <>
                <Combobox.Button className="flex w-full cursor-pointer items-center justify-between gap-1 rounded-md border px-3 py-1.5 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {syncedGithubRepository && syncedGithubRepository.length > 0
                    ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                    : "Select Repository"}
                  <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                </Combobox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Combobox.Options className="absolute right-0 z-10 mt-1 min-w-[10rem] origin-top-right rounded-md bg-white p-2 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="flex w-full items-center justify-start rounded-sm border bg-gray-100 px-2 text-gray-500">
                      <MagnifyingGlassIcon className="h-3 w-3" />
                      <Combobox.Input
                        className="w-full bg-transparent py-1 px-2 text-xs focus:outline-none"
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type to search..."
                        displayValue={(assigned: any) => assigned?.name}
                      />
                    </div>
                    <div className="vertical-scroll-enable mt-2 max-h-44 space-y-1 overflow-y-scroll">
                      <p className="px-1 text-[0.6rem] text-gray-500">
                        {options.length} of {totalCount} repositories
                      </p>
                      {paginatedData ? (
                        filteredOptions.length > 0 ? (
                          filteredOptions.map((option) => (
                            <Combobox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active, selected }) =>
                                `${active || selected ? "bg-hover-gray" : ""} ${
                                  selected ? "font-medium" : ""
                                } flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-gray-500`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  {option.content}
                                  {selected && <CheckIcon className="h-4 w-4" />}
                                </>
                              )}
                            </Combobox.Option>
                          ))
                        ) : (
                          <p className="text-center text-gray-500">No matching results</p>
                        )
                      ) : (
                        <p className="text-center text-gray-500">Loading...</p>
                      )}
                      {userRepositories && options.length < totalCount && (
                        <button
                          type="button"
                          className="w-full p-1 text-center text-[0.6rem] text-gray-500 hover:bg-hover-gray"
                          onClick={() => setSize(size + 1)}
                          disabled={isValidating}
                        >
                          {isValidating ? "Loading..." : "Click to load more..."}
                        </button>
                      )}
                    </div>
                  </Combobox.Options>
                </Transition>
              </>
            )}
          </Combobox>
        </div>
      )}
    </>
  );
};
