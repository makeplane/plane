import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const WorkspaceSelectorEmptyState = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const image = useResolvedAssetPath({
    basePath: "/empty-state/marketplace/empty-workspace",
    extension: "png",
  });

  return (
    <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-8 items-center">
      <div className="text-3xl font-bold text-center">{t("no_workspaces_to_connect")}</div>
      <div className="font-medium text-custom-text-300 max-w-[450px] text-center">
        {t("no_workspaces_to_connect_description")}
      </div>
      <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mb-10 w-full md:w-fit">
        <div className="w-full flex flex-col gap-2 items-center md:w-[450px]">
          <Image src={image} alt="empty workspace" width={384} height={250} />
          <div className="flex gap-2 flex-col md:flex-row">
            <a
              href="https://docs.plane.so/core-concepts/workspaces/overview"
              target="_blank"
              className={cn(getButtonStyling("outline-primary", "md"), "border-custom-border-200 text-custom-text-100")}
            >
              {t("learn_more_about_workspaces")}
            </a>
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
});
