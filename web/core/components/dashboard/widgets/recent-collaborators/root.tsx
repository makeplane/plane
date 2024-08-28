import { useState } from "react";
import { Search } from "lucide-react";
// types
import { BoxContainer } from "@/components/containers";
import { WidgetProps } from "@/components/dashboard/widgets";
// components
import { DefaultCollaboratorsList } from "./default-list";
import { SearchedCollaboratorsList } from "./search-list";

const PER_PAGE = 8;

export const RecentCollaboratorsWidget: React.FC<WidgetProps> = (props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <BoxContainer className="w-full">
      <div className="flex flex-col sm:flex-row items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-custom-text-300">Collaborators</h4>
          <p className="mt-2 text-xs font-medium text-custom-text-300">
            View and find all members you collaborate with across projects
          </p>
        </div>
        <div className="mt-5 sm:mt-0 flex min-w-72 items-center justify-start gap-2 rounded-md border border-custom-border-200 px-2.5 py-1.5 placeholder:text-custom-text-400">
          <Search className="h-3.5 w-3.5 text-custom-text-400" />
          <input
            className="w-full border-none bg-transparent text-sm focus:outline-none"
            placeholder="Search for collaborators"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {searchQuery.trim() !== "" ? (
        <SearchedCollaboratorsList
          dashboardId={dashboardId}
          perPage={PER_PAGE}
          searchQuery={searchQuery}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <DefaultCollaboratorsList dashboardId={dashboardId} perPage={PER_PAGE} workspaceSlug={workspaceSlug} />
      )}
    </BoxContainer>
  );
};
