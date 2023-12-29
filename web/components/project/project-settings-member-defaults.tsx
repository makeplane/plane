import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useProject, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
import { Controller, useForm } from "react-hook-form";

import { MemberSelect } from "components/project";
// ui
import { Loader } from "@plane/ui";
// types
import { IProject, IUserLite, IWorkspace } from "@plane/types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// constants
import { EUserProjectRoles } from "constants/project";

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

export const ProjectSettingsMemberDefaults: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, fetchProjectDetails, updateProject } = useProject();
  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  // hooks
  const { setToastAlert } = useToast();
  // form info
  const { reset, control } = useForm<IProject>({ defaultValues });
  // fetching user members
  useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId.toString()) : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug.toString(), projectId.toString()) : null
  );

  useEffect(() => {
    if (!currentProjectDetails) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails.default_assignee as IUserLite)?.id ?? currentProjectDetails.default_assignee,
      project_lead: (currentProjectDetails.project_lead as IUserLite)?.id ?? currentProjectDetails.project_lead,
      workspace: (currentProjectDetails.workspace as IWorkspace).id,
    });
  }, [currentProjectDetails, reset]);

  const submitChanges = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails?.default_assignee as IUserLite)?.id ?? currentProjectDetails?.default_assignee,
      project_lead: (currentProjectDetails?.project_lead as IUserLite)?.id ?? currentProjectDetails?.project_lead,
      ...formData,
    });

    await updateProject(workspaceSlug.toString(), projectId.toString(), {
      default_assignee: formData.default_assignee === "none" ? null : formData.default_assignee,
      project_lead: formData.project_lead === "none" ? null : formData.project_lead,
    })
      .then(() => {
        fetchProjectDetails(workspaceSlug.toString(), projectId.toString());
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Project updated successfully",
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <>
      <div className="flex items-center border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Defaults</h3>
      </div>

      <div className="flex w-full flex-col gap-2 pb-4">
        <div className="flex w-full items-center gap-4 py-8">
          <div className="flex w-1/2 flex-col gap-2">
            <h4 className="text-sm">Project Lead</h4>
            <div className="">
              {currentProjectDetails ? (
                <Controller
                  control={control}
                  name="project_lead"
                  render={({ field: { value } }) => (
                    <MemberSelect
                      value={value}
                      onChange={(val: string) => {
                        submitChanges({ project_lead: val });
                      }}
                      isDisabled={!isAdmin}
                    />
                  )}
                />
              ) : (
                <Loader className="h-9 w-full">
                  <Loader.Item width="100%" height="100%" />
                </Loader>
              )}
            </div>
          </div>

          <div className="flex w-1/2 flex-col gap-2">
            <h4 className="text-sm">Default Assignee</h4>
            <div className="">
              {currentProjectDetails ? (
                <Controller
                  control={control}
                  name="default_assignee"
                  render={({ field: { value } }) => (
                    <MemberSelect
                      value={value}
                      onChange={(val: string) => {
                        submitChanges({ default_assignee: val });
                      }}
                      isDisabled={!isAdmin}
                    />
                  )}
                />
              ) : (
                <Loader className="h-9 w-full">
                  <Loader.Item width="100%" height="100%" />
                </Loader>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
