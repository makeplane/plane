import { FileText, LayoutGrid } from "lucide-react";
// plane imports
import { InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
import {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspaceSearchResult,
  IWorkspaceInitiativeSearchResult,
  IWorkspaceTeamspaceSearchResult,
} from "@plane/types";
// plane web imports
import { generateWorkItemLink } from "@plane/utils";
import { commandGroups as commandGroupsCE, TCommandGroups } from "@/ce/components/command-palette/helpers";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export const commandGroups: TCommandGroups = {
  ...commandGroupsCE,
  epic: {
    title: "Epics",
    icon: null,
    itemName: (epic: IWorkspaceIssueSearchResult) => (
      <div className="flex gap-2">
        <IssueIdentifier
          projectId={epic.project_id}
          issueTypeId={epic.type_id}
          projectIdentifier={epic.project__identifier}
          issueSequenceId={epic.sequence_id}
          textContainerClassName="text-xs"
        />{" "}
        {epic.name}
      </div>
    ),
    path: (epic: IWorkspaceIssueSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: epic?.workspace__slug,
        projectId: epic?.project_id,
        issueId: epic?.id,
        projectIdentifier: epic.project__identifier,
        sequenceId: epic?.sequence_id,
        isEpic: true,
      }),
  },
  team: {
    title: "Teamspaces",
    icon: <TeamsIcon className="size-3.5" />,
    itemName: (team: IWorkspaceTeamspaceSearchResult) => team?.name,
    path: (team: IWorkspaceTeamspaceSearchResult) => `/${team?.workspace__slug}/teamspaces/${team?.id}`,
  },
  initiative: {
    title: "Initiatives",
    icon: <InitiativeIcon className="size-3.5" />,
    itemName: (initiative: IWorkspaceInitiativeSearchResult) => initiative?.name,
    path: (initiative: IWorkspaceInitiativeSearchResult) =>
      `/${initiative?.workspace__slug}/initiatives/${initiative?.id}`,
  },
};

export const pagesAppCommandGroups: TCommandGroups = {
  page: {
    icon: <FileText className="size-3" />,
    itemName: (page: IWorkspaceDefaultSearchResult) => page?.name,
    path: (page: IWorkspaceDefaultSearchResult) => `/${page?.workspace__slug}/pages/${page?.id}`,
    title: "Pages",
  },
  workspace: {
    icon: <LayoutGrid className="size-3" />,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/pages`,
    title: "Workspaces",
  },
};
