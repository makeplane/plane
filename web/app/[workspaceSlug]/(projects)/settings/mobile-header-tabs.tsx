import { useParams, usePathname } from "next/navigation";
// constants
import { WORKSPACE_SETTINGS_LINKS } from "@/constants/workspace";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

export const MobileWorkspaceSettingsTabs = () => {
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  return (
    <div className="flex-shrink-0 md:hidden sticky inset-0 flex overflow-x-auto bg-custom-background-100 z-10">
      {WORKSPACE_SETTINGS_LINKS.map((item, index) => (
        <div
          className={`${item.highlight(pathname, `/${workspaceSlug}`)
              ? "text-custom-primary-100 text-sm py-2 px-3 whitespace-nowrap flex flex-grow cursor-pointer justify-around border-b border-custom-primary-200"
              : "text-custom-text-200 flex flex-grow cursor-pointer justify-around border-b border-custom-border-200 text-sm py-2 px-3 whitespace-nowrap"
            }`}
          key={index}
          onClick={() => router.push(`/${workspaceSlug}${item.href}`)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};
