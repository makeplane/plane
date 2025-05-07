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
  const sizeClass = size === "sm" ? "h-4 w-4 text-[9px]" : size === "md" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
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
        <div
          className={cn(
            "relative flex items-center justify-center rounded bg-gray-700 uppercase text-white my-auto",
            sizeClass
          )}
        >
          {workspace?.name?.charAt(0) ?? "N"}
        </div>
      )}
    </div>
  );
};

export default WorkspaceLogo;
