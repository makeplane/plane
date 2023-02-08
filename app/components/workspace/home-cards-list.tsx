import { FC } from "react";
import { IIssue, IProject } from "types";

export interface WorkspaceHomeCardsListProps {
  groupedIssues: any;
  myIssues: IIssue[];
  projects: IProject[];
}

export const WorkspaceHomeCardsList: FC<WorkspaceHomeCardsListProps> = (props) => {
  const { groupedIssues, myIssues, projects } = props;
  const cards = [
    {
      title: "Issues completed",
      number: groupedIssues.completed.length,
    },
    {
      title: "Issues pending",
      number: myIssues?.length ?? 0 - groupedIssues.completed.length,
    },
    {
      title: "Projects",
      number: projects?.length ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-5">
      {cards.map((card, index) => (
        <div key={index} className="rounded-lg border bg-white p-4 text-center">
          <p className="text-gray-500">{card.title}</p>
          <h2 className="mt-2 text-3xl font-semibold">{card.number}</h2>
        </div>
      ))}
    </div>
  );
};
