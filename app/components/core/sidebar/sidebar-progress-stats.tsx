import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import issuesServices from "services/issues.service";
import projectService from "services/project.service";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useIssuesView from "hooks/use-issues-view";
// components
import { SingleProgressStats } from "components/core";
// ui
import { Avatar } from "components/ui";
// icons
import User from "public/user.png";
// types
import { IIssue, IIssueLabels, IModule, UserAuth } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS } from "constants/fetch-keys";
// types
type Props = {
  groupedIssues: any;
  issues: IIssue[];
  module?: IModule;
  userAuth?: UserAuth;
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

export const SidebarProgressStats: React.FC<Props> = ({
  groupedIssues,
  issues,
  module,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { filters, setFilters } = useIssuesView();

  const { storedValue: tab, setValue: setTab } = useLocalStorage("tab", "Assignees");

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

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Assignees":
        return 0;
      case "Labels":
        return 1;
      case "States":
        return 2;

      default:
        return 3;
    }
  };
  return (
    <Tab.Group
      defaultIndex={currentValue(tab)}
      onChange={(i) => {
        switch (i) {
          case 0:
            return setTab("Assignees");
          case 1:
            return setTab("Labels");
          case 2:
            return setTab("States");

          default:
            return setTab("States");
        }
      }}
    >
      <Tab.List
        as="div"
        className={`flex w-full items-center justify-between rounded-md bg-brand-surface-1 px-1 py-1.5 
        ${module ? "text-xs" : "text-sm"} `}
      >
        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1 text-brand-base  ${
              selected ? " bg-brand-accent text-white" : "  hover:bg-brand-surface-2"
            }`
          }
        >
          Assignees
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1 text-brand-base ${
              selected ? " bg-brand-accent text-white" : " hover:bg-brand-surface-2"
            }`
          }
        >
          Labels
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1  text-brand-base ${
              selected ? " bg-brand-accent text-white" : " hover:bg-brand-surface-2"
            }`
          }
        >
          States
        </Tab>
      </Tab.List>
      <Tab.Panels className="flex w-full items-center justify-between pt-1">
        <Tab.Panel as="div" className="flex w-full flex-col text-xs">
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
                  onClick={() => {
                    if (filters.assignees?.includes(member.member.id))
                      setFilters({
                        assignees: filters.assignees?.filter((a) => a !== member.member.id),
                      });
                    else
                      setFilters({ assignees: [...(filters?.assignees ?? []), member.member.id] });
                  }}
                  selected={filters.assignees?.includes(member.member.id)}
                />
              );
            }
          })}
          {issues?.filter((i) => i.assignees?.length === 0).length > 0 ? (
            <SingleProgressStats
              title={
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-brand-surface-2">
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
        <Tab.Panel as="div" className="w-full space-y-1">
          {issueLabels?.map((label, index) => {
            const totalArray = issues?.filter((i) => i.labels?.includes(label.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");

            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={
                    <div className="flex items-center gap-2">
                      <span
                        className="block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            label.color && label.color !== "" ? label.color : "#000000",
                        }}
                      />
                      <span className="text-xs capitalize">{label.name}</span>
                    </div>
                  }
                  completed={completeArray.length}
                  total={totalArray.length}
                  onClick={() => {
                    if (filters.labels?.includes(label.id))
                      setFilters({
                        labels: filters.labels?.filter((l) => l !== label.id),
                      });
                    else setFilters({ labels: [...(filters?.labels ?? []), label.id] });
                  }}
                  selected={filters.labels?.includes(label.id)}
                />
              );
            }
          })}
        </Tab.Panel>
        <Tab.Panel as="div" className="flex w-full flex-col ">
          {Object.keys(groupedIssues).map((group, index) => (
            <SingleProgressStats
              key={index}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="block h-3 w-3 rounded-full "
                    style={{
                      backgroundColor: stateGroupColours[group],
                    }}
                  />
                  <span className="text-xs capitalize">{group}</span>
                </div>
              }
              completed={groupedIssues[group]}
              total={issues.length}
            />
          ))}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
