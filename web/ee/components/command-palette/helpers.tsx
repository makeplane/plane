import { FileText, LayoutGrid } from "lucide-react";
// types
import { IWorkspaceDefaultSearchResult, IWorkspaceSearchResult } from "@plane/types";

export const pagesAppCommandGroups: {
  [key: string]: {
    icon: JSX.Element;
    itemName: (item: any) => React.ReactNode;
    path: (item: any) => string;
    title: string;
  };
} = {
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
