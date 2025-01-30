"use client";

import { FC, useEffect } from "react";

import { useParams } from "next/navigation";

// react-hook-form
import { UseFormSetValue } from "react-hook-form";
import useSWR from "swr";
// services
// ui
import { Button, Loader } from "@plane/ui";
// types
import { IUserDetails, TFormValues, TIntegrationSteps } from "@/components/integration";
// fetch-keys
import { GITHUB_REPOSITORY_INFO } from "@/constants/fetch-keys";
import { GithubIntegrationService } from "@/services/integrations";

type Props = {
  selectedRepo: any;
  handleStepChange: (value: TIntegrationSteps) => void;
  setUsers: React.Dispatch<React.SetStateAction<IUserDetails[]>>;
  setValue: UseFormSetValue<TFormValues>;
};

// services
const githubIntegrationService = new GithubIntegrationService();

export const GithubRepoDetails: FC<Props> = ({ selectedRepo, handleStepChange, setUsers, setValue }) => {
  const { workspaceSlug } = useParams();

  const { data: repoInfo } = useSWR(
    workspaceSlug && selectedRepo ? GITHUB_REPOSITORY_INFO(workspaceSlug as string, selectedRepo.name) : null,
    workspaceSlug && selectedRepo
      ? () =>
          githubIntegrationService.getGithubRepoInfo(workspaceSlug as string, {
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
          })
      : null
  );

  useEffect(() => {
    if (!repoInfo) return;

    setValue("collaborators", repoInfo.collaborators);

    const fetchedUsers = repoInfo.collaborators.map((collaborator) => ({
      username: collaborator.login,
      import: "map",
      email: "",
    }));
    setUsers(fetchedUsers);
  }, [repoInfo, setUsers, setValue]);

  return (
    <div className="mt-6">
      {repoInfo ? (
        repoInfo.issue_count > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">Repository Details</div>
              <div className="text-sm text-custom-text-200">Import completed. We have found:</div>
            </div>
            <div className="mt-4 flex gap-16">
              <div className="flex-shrink-0 text-center">
                <p className="text-3xl font-bold">{repoInfo.issue_count}</p>
                <h6 className="text-sm text-custom-text-200">Work items</h6>
              </div>
              <div className="flex-shrink-0 text-center">
                <p className="text-3xl font-bold">{repoInfo.labels}</p>
                <h6 className="text-sm text-custom-text-200">Labels</h6>
              </div>
              <div className="flex-shrink-0 text-center">
                <p className="text-3xl font-bold">{repoInfo.collaborators.length}</p>
                <h6 className="text-sm text-custom-text-200">Users</h6>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h5>We didn{"'"}t find any work item in this repository.</h5>
          </div>
        )
      ) : (
        <Loader>
          <Loader.Item height="70px" />
        </Loader>
      )}
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="neutral-primary" onClick={() => handleStepChange("import-data")}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => handleStepChange("import-users")}
          disabled={!repoInfo || repoInfo.issue_count === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
