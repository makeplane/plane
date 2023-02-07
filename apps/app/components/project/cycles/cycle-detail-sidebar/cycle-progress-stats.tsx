import React from "react";
import { Tab } from "@headlessui/react";

// types
import { IIssue, IIssueLabels, IProjectMember } from "types";
import { CircularProgressbar } from "react-circular-progressbar";
import { Avatar } from "components/ui";

type Props = {
  issues: IIssue[];
  issueLabels: IIssueLabels[] | undefined;
  members: IProjectMember[] | undefined;
};

const CycleProgressStats: React.FC<Props> = ({ issues, members, issueLabels }) => (
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
            const memberIssues = issues?.filter((i) => i.assignees?.includes(member.member.id));
            const completedIssues = memberIssues?.filter(
              (i) => i.state_detail.group === "completed"
            );

            if (memberIssues.length > 0) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between w-full py-3
                text-xs border-b-[1px] border-gray-200"
                >
                  <div className="flex items-center justify-start w-1/2 gap-2">
                    <Avatar user={member.member} />
                    <span>{member.member.first_name}</span>
                  </div>

                  <div className="flex items-center justify-end w-1/2 gap-1 px-2">
                    <div className="flex justify-center items-center gap-1 ">
                      <span className="h-4 w-4 ">
                        <CircularProgressbar
                          value={completedIssues.length}
                          maxValue={memberIssues.length}
                          strokeWidth={10}
                        />
                      </span>
                      <span className="w-8 text-right">
                        {Math.floor((completedIssues.length / memberIssues.length) * 100)}%
                      </span>
                    </div>
                    <span>of</span>
                    <span>{memberIssues.length}</span>
                  </div>
                </div>
              );
            }
          })}
        </Tab.Panel>
        <Tab.Panel as="div" className="w-full flex flex-col ">
          {issueLabels?.map((issue, index) => {
            const currentLabelArray = issues?.filter((i) => i.labels?.includes(issue.id));
            const completedLabel = currentLabelArray?.filter(
              (i) => i.state_detail.group === "completed"
            );

            if (currentLabelArray.length) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between w-full py-3
                text-xs border-b-[1px] border-gray-200"
                >
                  <div className="flex items-center justify-start w-1/2 gap-2">
                    <span
                      className="block h-2 w-2 rounded-full "
                      style={{
                        backgroundColor: issue.color,
                      }}
                    />
                    <span className="text-xs capitalize">{issue.name}</span>
                  </div>

                  <div className="flex items-center justify-end w-1/2 gap-1 px-2">
                    <div className="flex justify-center items-center gap-1 ">
                      <span className="h-4 w-4 ">
                        <CircularProgressbar
                          value={completedLabel.length}
                          maxValue={currentLabelArray.length}
                          strokeWidth={10}
                        />
                      </span>
                      <span className="w-8 text-right">
                        {Math.floor((completedLabel.length / currentLabelArray.length) * 100)}%
                      </span>
                    </div>
                    <span>of</span>
                    <span>{currentLabelArray.length}</span>
                  </div>
                </div>
              );
            }
          })}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  </div>
);

export default CycleProgressStats;
