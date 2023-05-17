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
  issues: IIssue[];
};

export const ActiveCycleProgressStats: React.FC<Props> = ({ issues }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { storedValue: tab, setValue: setTab } = useLocalStorage("activeCycleTab", "Assignees");

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

      default:
        return 0;
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

          default:
            return setTab("Assignees");
        }
      }}
    >
      <Tab.List as="div" className="flex flex-wrap items-center justify-start gap-4 text-sm">
        <Tab
          className={({ selected }) =>
            `px-3 py-1 text-brand-base rounded-3xl border border-brand-base ${
              selected ? " bg-brand-accent text-white" : "  hover:bg-brand-surface-2"
            }`
          }
        >
          Assignees
        </Tab>
        <Tab
          className={({ selected }) =>
            `px-3 py-1 text-brand-base rounded-3xl border border-brand-base ${
              selected ? " bg-brand-accent text-white" : "  hover:bg-brand-surface-2"
            }`
          }
        >
          Labels
        </Tab>
      </Tab.List>
      <Tab.Panels className="flex w-full">
        <Tab.Panel
          as="div"
          className="flex flex-col w-full mt-2 gap-1 items-center text-brand-secondary"
        >
          {members?.map((member, index) => {
            const totalArray = issues?.filter((i) => i?.assignees?.includes(member.member.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");

            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={
                    <div className="flex items-center gap-2">
                      <Avatar user={member.member} />
                      <span>{member.member.first_name}</span>
                    </div>
                  }
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
          {issues?.filter((i) => i?.assignees?.length === 0).length > 0 ? (
            <SingleProgressStats
              title={
                <div className="flex items-center gap-2">
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
                </div>
              }
              completed={
                issues?.filter(
                  (i) => i?.state_detail.group === "completed" && i.assignees?.length === 0
                ).length
              }
              total={issues?.filter((i) => i?.assignees?.length === 0).length}
            />
          ) : (
            ""
          )}
        </Tab.Panel>
        <Tab.Panel
          as="div"
          className="flex flex-col w-full mt-2 gap-1 items-center text-brand-secondary"
        >
          {issueLabels?.map((label, index) => {
            const totalArray = issues?.filter((i) => i?.labels?.includes(label.id));
            const completeArray = totalArray?.filter((i) => i?.state_detail.group === "completed");

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
                      <span className="text-xs capitalize">{label?.name}</span>
                    </div>
                  }
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
