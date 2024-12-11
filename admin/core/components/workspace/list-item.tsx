import { observer } from "mobx-react";
import { ExternalLink } from "lucide-react";
// helpers
import { Tooltip } from "@plane/ui";
import { WEB_BASE_URL } from "@/helpers/common.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

export const WorkspaceListItem = observer(({ workspaceId }: TWorkspaceListItemProps) => {
  // store hooks
  const { getWorkspaceById } = useWorkspace();
  // derived values
  const workspace = getWorkspaceById(workspaceId);

  if (!workspace) return null;
  return (
    <a
      key={workspaceId}
      href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
      target="_blank"
      className="group flex items-center justify-between p-4 gap-2.5 truncate border border-custom-border-200/70 hover:border-custom-border-200 hover:bg-custom-background-90 rounded-md"
    >
      <div className="flex items-start gap-4">
        <span
          className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 mt-1 text-xs uppercase ${
            !workspace?.logo_url && "rounded bg-custom-primary-500 text-white"
          }`}
        >
          {workspace?.logo_url && workspace.logo_url !== "" ? (
            <img
              src={getFileURL(workspace.logo_url)}
              className="absolute left-0 top-0 h-full w-full rounded object-cover"
              alt="Workspace Logo"
            />
          ) : (
            (workspace?.name?.[0] ?? "...")
          )}
        </span>
        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-wrap w-full items-center gap-2.5">
            <h3 className={`text-base font-medium capitalize`}>{workspace.name}</h3>/
            <Tooltip tooltipContent="The unique URL of your workspace">
              <h4 className="text-sm text-custom-text-300">[{workspace.slug}]</h4>
            </Tooltip>
          </div>
          {workspace.owner.email && (
            <div className="flex items-center gap-1 text-xs">
              <h3 className="text-custom-text-200 font-medium">Owned by:</h3>
              <h4 className="text-custom-text-300">{workspace.owner.email}</h4>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs">
            {workspace.total_projects !== null && (
              <span className="flex items-center gap-1">
                <h3 className="text-custom-text-200 font-medium">Total projects:</h3>
                <h4 className="text-custom-text-300">{workspace.total_projects}</h4>
              </span>
            )}
            {workspace.total_members !== null && (
              <>
                •
                <span className="flex items-center gap-1">
                  <h3 className="text-custom-text-200 font-medium">Total members:</h3>
                  <h4 className="text-custom-text-300">{workspace.total_members}</h4>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <ExternalLink size={14} className="text-custom-text-400 group-hover:text-custom-text-200" />
      </div>
    </a>
  );
});
