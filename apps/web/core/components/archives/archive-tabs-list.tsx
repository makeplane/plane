import type { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// types
import type { IProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";

const ARCHIVES_TAB_LIST: {
  key: string;
  label: string;
  shouldRender: (projectDetails: IProject) => boolean;
}[] = [
  {
    key: "issues",
    label: "Work items",
    shouldRender: () => true,
  },
  {
    key: "cycles",
    label: "Cycles",
    shouldRender: (projectDetails) => projectDetails.cycle_view,
  },
  {
    key: "modules",
    label: "Modules",
    shouldRender: (projectDetails) => projectDetails.module_view,
  },
];

export const ArchiveTabsList = observer(function ArchiveTabsList() {
  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // store hooks
  const { getProjectById } = useProject();

  // derived values
  if (!projectId) return null;
  const projectDetails = getProjectById(projectId?.toString());
  if (!projectDetails) return null;

  return (
    <>
      {ARCHIVES_TAB_LIST.map(
        (tab) =>
          tab.shouldRender(projectDetails) && (
            <Link key={tab.key} href={`/${workspaceSlug}/projects/${projectId}/archives/${tab.key}`}>
              <span
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 py-4 px-4 text-13 font-medium outline-none ${
                  pathname.includes(tab.key)
                    ? "border-accent-strong text-accent-primary"
                    : "border-transparent hover:border-subtle text-tertiary hover:text-placeholder"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
      )}
    </>
  );
});
