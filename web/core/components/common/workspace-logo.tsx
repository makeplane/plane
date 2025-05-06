import { cn } from "@/helpers/common.helper";
import { getFileURL } from "@/helpers/file.helper";

interface IWorkspaceLogoProps {
  workspace: {
    logo_url: string;
    name: string;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const WorkspaceLogo = (props: IWorkspaceLogoProps) => {
  const { workspace, className, size = "md" } = props;
  const sizeClass = size === "sm" ? "h-6 w-6 text-sm" : size === "md" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <div className={cn("flex gap-3 items-center", className)}>
      {workspace.logo_url && workspace.logo_url !== "" ? (
        <div className={cn("relative my-auto flex rounded", sizeClass)}>
          <img
            src={getFileURL(workspace.logo_url)}
            className={cn("absolute left-0 top-0 h-full w-full rounded-md object-cover", sizeClass)}
            alt="Workspace Logo"
          />
        </div>
      ) : (
        <span
          className={cn(
            "relative flex h-8 w-8 flex-shrink-0 items-center  justify-center p-2 text-base uppercase font-medium border-custom-border-200",
            { "rounded-md bg-custom-primary-500 text-white": !workspace?.logo_url },
            sizeClass
          )}
        >
          {workspace?.logo_url && workspace.logo_url !== "" ? (
            <img
              src={getFileURL(workspace.logo_url)}
              className="absolute left-0 top-0 h-full w-full rounded object-cover"
              alt={"workspace_logo"}
            />
          ) : (
            (workspace?.name?.[0] ?? "...")
          )}
        </span>
      )}
    </div>
  );
};

export default WorkspaceLogo;
