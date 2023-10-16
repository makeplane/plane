import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Disclosure, Transition } from "@headlessui/react";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// services
import { ProjectService } from "services/project";
// components
import { DeleteProjectModal, ProjectDetailsForm, ProjectDetailsFormLoader, SettingsSidebar } from "components/project";
// components
import { Button, Loader } from "@plane/ui";
import { Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import type { NextPage } from "next";
// fetch-keys
import { USER_PROJECT_VIEW } from "constants/fetch-keys";
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

// services
const projectService = new ProjectService();

const GeneralSettings: NextPage = observer(() => {
  const { project: projectStore } = useMobxStore();
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // derived values
  const projectDetails = projectId ? projectStore.project_details[projectId.toString()] : null;
  console.log("projectDetails", projectDetails);
  console.log("condition", workspaceSlug && projectId && !projectDetails);
  console.log("wow", projectId);
  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_DETAILS" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // API call to fetch user privileges
  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);
  // const selectedNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  const isAdmin = memberDetails?.role === 20;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title="General Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      {projectDetails && (
        <DeleteProjectModal
          project={projectDetails}
          isOpen={Boolean(selectProject)}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <div className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
          {projectDetails && workspaceSlug ? (
            <ProjectDetailsForm project={projectDetails} workspaceSlug={workspaceSlug.toString()} isAdmin={isAdmin} />
          ) : (
            <ProjectDetailsFormLoader />
          )}

          {isAdmin && (
            <Disclosure as="div" className="border-t border-custom-border-400">
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="flex items-center justify-between w-full py-4"
                  >
                    <span className="text-xl tracking-tight">Delete Project</span>
                    <Icon iconName={open ? "expand_less" : "expand_more"} className="!text-2xl" />
                  </Disclosure.Button>

                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel>
                      <div className="flex flex-col gap-8">
                        <span className="text-sm tracking-tight">
                          The danger zone of the project delete page is a critical area that requires careful
                          consideration and attention. When deleting a project, all of the data and resources within
                          that project will be permanently removed and cannot be recovered.
                        </span>
                        <div>
                          {projectDetails ? (
                            <div>
                              <Button variant="danger" onClick={() => setSelectedProject(projectDetails.id ?? null)}>
                                Delete my project
                              </Button>
                            </div>
                          ) : (
                            <Loader className="mt-2 w-full">
                              <Loader.Item height="38px" width="144px" />
                            </Loader>
                          )}
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          )}
        </div>
      </div>
    </ProjectAuthorizationWrapper>
  );
});

export default GeneralSettings;
