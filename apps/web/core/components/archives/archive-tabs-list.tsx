import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// types
import { IProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store";

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

export const ArchiveTabsList: FC = observer(() => {
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
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 py-3 px-4 text-sm font-medium outline-none ${
                  pathname.includes(tab.key)
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 text-custom-text-300 hover:text-custom-text-400"
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
