import { useState } from "react";
import { Search } from "lucide-react";
// types
import { Card } from "@plane/ui";
import { WidgetProps } from "@/components/dashboard/widgets";
// components
import { CollaboratorsList } from "./collaborators-list";

export const RecentCollaboratorsWidget: React.FC<WidgetProps> = (props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
        <div>
          <h4 className="text-lg font-semibold text-custom-text-300">Collaborators</h4>
          <p className="mt-2 text-xs font-medium text-custom-text-300">
            View and find all members you collaborate with across projects
          </p>
        </div>
        <div className="mt-5 sm:mt-0 flex min-w-full md:min-w-72 items-center justify-start gap-2 rounded-md border border-custom-border-200 px-2.5 py-1.5 placeholder:text-custom-text-400">
          <Search className="h-3.5 w-3.5 text-custom-text-400" />
          <input
            className="w-full border-none bg-transparent text-sm focus:outline-none"
            placeholder="Search for collaborators"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <CollaboratorsList dashboardId={dashboardId} searchQuery={searchQuery} workspaceSlug={workspaceSlug} />
    </Card>
  );
};
