import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EUserPermissions } from "@plane/types/src/enums";
import { getButtonStyling, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { WorkspaceLogo } from "@/components/workspace";
import { useWorkspace } from "@/hooks/store";
import DarkImage from "@/public/empty-state/marketplace/empty-workspace-dark.png";
import LightImage from "@/public/empty-state/marketplace/empty-workspace-light.png";

export const WorkspacePicker = observer(() => {
  // router
  const { slug } = useParams();
  // store
  const { loader, workspaces } = useWorkspace();
  const { t } = useTranslation();
  // state
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  // hook
  const { resolvedTheme } = useTheme();
  const image = resolvedTheme === "dark" ? DarkImage : LightImage;

  const currentUserAdminWorkspaces = Object.values(workspaces ?? {})?.filter((w) => w.role === EUserPermissions.ADMIN);

  if (!loader && currentUserAdminWorkspaces?.length === 0) {
    return (
      <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-8 items-center">
        <div className="text-3xl font-bold text-center">{t("no_workspaces_to_connect")}</div>
        <div className="font-medium text-custom-text-300 max-w-[450px] text-center">
          {t("no_workspaces_to_connect_description")}
        </div>
        <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mb-10 w-full md:w-fit">
          <div className="w-full flex flex-col gap-2 items-center md:w-[450px]">
            <Image src={image} alt="empty workspace" />
            <div className="flex gap-2 flex-col md:flex-row">
              <Link
                href="https://plane.so/"
                target="_blank"
                className={cn(
                  getButtonStyling("outline-primary", "md"),
                  "border-custom-border-200 text-custom-text-100"
                )}
              >
                {t("learn_more_about_workspaces")}
              </Link>
              <Link
                href="/create-workspace"
                className={cn("text-sm text-custom-text-300 w-full", getButtonStyling("primary", "md"))}
              >
                {t("create_a_new_workspace")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-8 items-center">
      <div className="text-3xl font-bold text-center">{t("choose_workspace_for_integration")}</div>
      <div className="font-medium text-custom-text-300 max-w-[450px] text-center">{t("integrations_description")}</div>
      <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mb-10 w-full md:w-fit">
        <div className="w-full flex flex-col md:w-[450px] bg-custom-background-90 rounded p-4 gap-2 border-[0.5px] border-custom-border-200">
          {loader ? (
            <Loader className="w-full flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Loader.Item key={index} height="43px" />
              ))}
            </Loader>
          ) : (
            currentUserAdminWorkspaces?.map((workspace) => (
              <div key={workspace.id} className="w-full bg-custom-background-100 rounded">
                <Link
                  href={`/${workspace.slug}/settings/integrations/${slug}`}
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
                    <WorkspaceLogo logo={workspace.logo_url} name={workspace.name} classNames="text-sm" />
                    <div className="text-sm text-custom-text-200 font-medium">{workspace.name}</div>
                  </div>
                  {selectedWorkspace === workspace.id && (
                    <div className="ml-auto size-[14px] bg-custom-primary-100 rounded-full flex items-center justify-center">
                      <Check className="text-white w-[10px] h-[10px] m-auto" />
                    </div>
                  )}
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
