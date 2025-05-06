import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store";
import WorkspaceLogo from "../workspace-logo";

export const WorkspacePicker = () => {
  // router
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next_path");
  // store
  const { loader, currentUserAdninWorkspaces } = useWorkspace();
  const { t } = useTranslation();
  // state
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  if (!loader && currentUserAdninWorkspaces?.length === 0) {
    return (
      <Link
        href="/create-workspace"
        className={cn("text-sm text-custom-text-300 w-full md:w-[450px]", getButtonStyling("primary", "md"))}
      >
        {t("create_a_new_workspace")}
      </Link>
    );
  }

  return (
    <div className="w-full flex flex-col md:w-[450px] bg-custom-background-90 rounded p-4 gap-2 border-[0.5px] border-custom-border-200">
      {loader && (
        <Loader className="w-full flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Loader.Item key={index} height="43px" />
          ))}
        </Loader>
      )}
      {!loader &&
        currentUserAdninWorkspaces?.map((workspace) => (
          <div key={workspace.id} className="w-full bg-custom-background-100 rounded">
            <Link
              href={`/${workspace.slug}${nextPath || ""}`}
              className={cn(
                "rounded p-2.5 flex items-center gap-2 border-[0.5px] border-custom-border-200 transition-all duration-200",
                "hover:bg-custom-primary-100/20 hover:border-custom-primary-100",
                {
                  "bg-custom-primary-100/20 border-custom-primary-100": selectedWorkspace === workspace.id,
                }
              )}
              onClick={() => setSelectedWorkspace(workspace.id)}
            >
              <div className="flex gap-2 items-center">
                <WorkspaceLogo
                  workspace={{
                    logo_url: workspace.logo_url ?? "",
                    name: workspace.name,
                  }}
                  size="sm"
                />
                <div className="text-sm text-custom-text-200 font-medium">{workspace.name}</div>
              </div>
              {selectedWorkspace === workspace.id && (
                <div className="ml-auto size-[14px] bg-custom-primary-100 rounded-full flex items-center justify-center">
                  <Check className="text-white w-[10px] h-[10px] m-auto" />
                </div>
              )}
            </Link>
          </div>
        ))}
    </div>
  );
};
