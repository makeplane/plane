import { FC, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
// services
import GithubIntegrationService from "services/integration/github.service";
// ui
import { Loader, PrimaryButton, SecondaryButton } from "components/ui";
// types
import { TFormValues, TIntegrationSteps } from "components/integration";

type Props = {
  selectedRepo: any;
  handleStepChange: (value: TIntegrationSteps) => void;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
};

export const GithubRepoDetails: FC<Props> = ({
  selectedRepo,
  handleStepChange,
  watch,
  setValue,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: repoInfo } = useSWR(
    workspaceSlug && selectedRepo
      ? `GITHUB_REPO_INFO_${workspaceSlug
          .toString()
          .toUpperCase()}_${selectedRepo.name.toUpperCase()}`
      : null,
    workspaceSlug && selectedRepo
      ? () =>
          GithubIntegrationService.getGithubRepoInfo(workspaceSlug as string, {
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
          })
      : null
  );

  useEffect(() => {
    if (!repoInfo) return;

    setValue("collaborators", repoInfo?.collaborators ?? []);
    const users = watch("collaborators").map((collaborator) => ({
      username: collaborator.login,
      import: "map",
      email: "",
    }));
    setValue("users", users);
  }, [setValue, repoInfo, watch]);

  return (
    <div className="mt-6">
      {repoInfo ? (
        repoInfo.issue_count > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <h5 className="text-sm">Import completed. We have found:</h5>
            <div className="flex gap-16 mt-4">
              <div className="text-center flex-shrink-0">
                <p className="text-3xl font-bold">{repoInfo.issue_count}</p>
                <h6 className="text-sm text-gray-500">Issues</h6>
              </div>
              <div className="text-center flex-shrink-0">
                <p className="text-3xl font-bold">{repoInfo.labels}</p>
                <h6 className="text-sm text-gray-500">Labels</h6>
              </div>
              <div className="text-center flex-shrink-0">
                <p className="text-3xl font-bold">{repoInfo.collaborators.length}</p>
                <h6 className="text-sm text-gray-500">Users</h6>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h5>We didn{"'"}t find any issue in this repository.</h5>
          </div>
        )
      ) : (
        <Loader>
          <Loader.Item height="70px" />
        </Loader>
      )}
      <div className="mt-6 flex items-center justify-end gap-2">
        <SecondaryButton onClick={() => handleStepChange("import-data")}>Back</SecondaryButton>
        <PrimaryButton
          onClick={() => handleStepChange("import-users")}
          disabled={!repoInfo || repoInfo.issue_count === 0}
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};
