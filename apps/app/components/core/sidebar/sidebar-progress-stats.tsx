import React from "react";
import { Tab } from "@headlessui/react";

// types

import SingleProgressStats from "./single-progress-stats";
import { Avatar } from "components/ui";
import { IIssue, IIssueLabels, IProjectMember } from "types";

type Props = {
  issues: IIssue[];
  issueLabels: IIssueLabels[] | undefined;
  members: IProjectMember[] | undefined;
};

const SidebarProgressStats: React.FC<Props> = ({ issues, members, issueLabels }) => (
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
      </Tab.List>
      <Tab.Panels className="flex items-center justify-between  w-full">
        <Tab.Panel as="div" className="w-full flex flex-col ">
          {members?.map((member, index) => {
            const totalArray = issues?.filter((i) => i.assignees?.includes(member.member.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
            const title = (
              <>
                <Avatar user={member.member} />
                <span>{member.member.first_name}</span>
              </>
            );
            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={title}
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
        </Tab.Panel>
        <Tab.Panel as="div" className="w-full flex flex-col ">
          {issueLabels?.map((issue, index) => {
            const totalArray = issues?.filter((i) => i.labels?.includes(issue.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
            const title = (
              <>
                <span
                  className="block h-2 w-2 rounded-full "
                  style={{
                    backgroundColor: issue.color,
                  }}
                />
                <span className="text-xs capitalize">{issue.name}</span>
              </>
            );
            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={title}
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  </div>
);

export default SidebarProgressStats;
