import Image from "next/image";

import useSWR, { mutate } from "swr";

// services
import projectService from "services/project.service";
// hooks
import { useRouter } from "next/router";
import useToast from "hooks/use-toast";
// ui
import { CustomSelect } from "components/ui";
// icons
import GithubLogo from "public/logos/github-black.png";
// types
import { IWorkspaceIntegrations } from "types";
// fetch-keys
import { PROJECT_GITHUB_REPOSITORY } from "constants/fetch-keys";

type Props = {
  integration: IWorkspaceIntegrations;
};

export const SingleIntegration: React.FC<Props> = ({ integration }) => {
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

  const { data: userRepositories } = useSWR("USER_REPOSITORIES", () =>
    workspaceSlug && integration
      ? projectService.getGithubRepositories(workspaceSlug as any, integration.id)
      : null
  );

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

  return (
    <>
      {integration && (
        <div className="flex items-center justify-between gap-2 border p-4 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12">
              <Image src={GithubLogo} alt="GithubLogo" />
            </div>
            <div>
              <h3 className="flex items-center gap-4 font-semibold text-xl">
                {integration.integration_detail.title}
              </h3>
              <p className="text-gray-400 text-sm">Select GitHub repository to enable sync.</p>
            </div>
          </div>
          <CustomSelect
            value={
              syncedGithubRepository && syncedGithubRepository.length > 0
                ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                : null
            }
            onChange={(val: string) => {
              const repo = userRepositories?.repositories.find((repo) => repo.full_name === val);

              handleChange(repo);
            }}
            label={
              syncedGithubRepository && syncedGithubRepository.length > 0
                ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                : "Select Repository"
            }
            input
          >
            {userRepositories ? (
              userRepositories.repositories.length > 0 ? (
                userRepositories.repositories.map((repo) => (
                  <CustomSelect.Option
                    key={repo.id}
                    value={repo.full_name}
                    className="flex items-center gap-2"
                  >
                    <>{repo.full_name}</>
                  </CustomSelect.Option>
                ))
              ) : (
                <p className="text-gray-400 text-center text-xs">No repositories found</p>
              )
            ) : (
              <p className="text-gray-400 text-center text-xs">Loading repositories</p>
            )}
          </CustomSelect>
        </div>
      )}
    </>
  );
};
