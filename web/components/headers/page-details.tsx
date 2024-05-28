import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { FileText } from "lucide-react";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { ProjectLogo } from "@/components/project";
// hooks
import { usePage, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const PageDetailsHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, pageId } = router.query;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { isContentEditable, isSubmitting, name } = usePage(pageId?.toString() ?? "");
  // use platform
  const { platform } = usePlatformOS();
  // derived values
  const isMac = platform === "MacOS";

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <span>
                  <span className="hidden md:block">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={currentProjectDetails?.name ?? "Project"}
                      icon={
                        currentProjectDetails && (
                          <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                            <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                          </span>
                        )
                      }
                    />
                  </span>
                  <span className="md:hidden">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={"..."}
                    />
                  </span>
                </span>
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink label={name ?? "Page"} icon={<FileText className="h-4 w-4 text-custom-text-300" />} />
              }
            />
          </Breadcrumbs>
        </div>
      </div>
      {isContentEditable && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // ctrl/cmd + s to save the changes
            const event = new KeyboardEvent("keydown", {
              key: "s",
              ctrlKey: !isMac,
              metaKey: isMac,
            });
            window.dispatchEvent(event);
          }}
          className="flex-shrink-0"
          loading={isSubmitting === "submitting"}
        >
          {isSubmitting === "submitting" ? "Saving" : "Save changes"}
        </Button>
      )}
    </div>
  );
});
