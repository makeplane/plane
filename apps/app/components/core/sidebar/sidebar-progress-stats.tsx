import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import issuesServices from "services/issues.service";
import projectService from "services/project.service";
// components
import { SingleProgressStats } from "components/core";
// ui
import { Avatar } from "components/ui";
// icons
import User from "public/user.png";
// types
import { IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS } from "constants/fetch-keys";
// types
type Props = {
  groupedIssues: any;
  issues: IIssue[];
};

const stateGroupColours: {
  [key: string]: string;
} = {
  backlog: "#3f76ff",
  unstarted: "#ff9e9e",
  started: "#d687ff",
  cancelled: "#ff5353",
  completed: "#096e8d",
};

export const SidebarProgressStats: React.FC<Props> = ({ groupedIssues, issues }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );
  return (
    <div className="flex flex-col items-center justify-center w-full gap-2 ">
      <Tab.Group>
        <Tab.List
          as="div"
          className="flex items-center justify-between w-full rounded bg-gray-100 text-xs"
        >
          <Tab
            className={({ selected }) =>
              `w-1/2 rounded py-1 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
            }
          >
            Assignees
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-1/2 rounded py-1 ${selected ? "bg-gray-300 font-semibold" : "hover:bg-gray-200 "}`
            }
          >
            Labels
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-1/2 rounded py-1 ${selected ? "bg-gray-300 font-semibold" : "hover:bg-gray-200 "}`
            }
          >
            States
          </Tab>
        </Tab.List>
        <Tab.Panels className="flex items-center justify-between  w-full">
          <Tab.Panel as="div" className="w-full flex flex-col ">
            {members?.map((member, index) => {
              const totalArray = issues?.filter((i) => i.assignees?.includes(member.member.id));
              const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
              if (totalArray.length > 0) {
                return (
                  <SingleProgressStats
                    key={index}
                    title={
                      <>
                        <Avatar user={member.member} />
                        <span>{member.member.first_name}</span>
                      </>
                    }
                    completed={completeArray.length}
                    total={totalArray.length}
                  />
                );
              }
            })}
            {issues?.filter((i) => i.assignees?.length === 0).length > 0 ? (
              <SingleProgressStats
                title={
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                      <Image
                        src={User}
                        height="100%"
                        width="100%"
                        className="rounded-full"
                        alt="User"
                      />
                    </div>
                    <span>No assignee</span>
                  </>
                }
                completed={
                  issues?.filter(
                    (i) => i.state_detail.group === "completed" && i.assignees?.length === 0
                  ).length
                }
                total={issues?.filter((i) => i.assignees?.length === 0).length}
              />
            ) : (
              ""
            )}
          </Tab.Panel>
          <Tab.Panel as="div" className="w-full flex flex-col ">
            {issueLabels?.map((issue, index) => {
              const totalArray = issues?.filter((i) => i.labels?.includes(issue.id));
              const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
              if (totalArray.length > 0) {
                return (
                  <SingleProgressStats
                    key={index}
                    title={
                      <>
                        <span
                          className="block h-2 w-2 rounded-full "
                          style={{
                            backgroundColor: issue.color,
                          }}
                        />
                        <span className="text-xs capitalize">{issue.name}</span>
                      </>
                    }
                    completed={completeArray.length}
                    total={totalArray.length}
                  />
                );
              }
            })}
          </Tab.Panel>
          <Tab.Panel as="div" className="w-full flex flex-col ">
            {Object.keys(groupedIssues).map((group, index) => (
              <SingleProgressStats
                key={index}
                title={
                  <>
                    <span
                      className="block h-2 w-2 rounded-full "
                      style={{
                        backgroundColor: stateGroupColours[group],
                      }}
                    />
                    <span className="text-xs capitalize">{group}</span>
                  </>
                }
                completed={groupedIssues[group].length}
                total={issues.length}
              />
            ))}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
