"use client";

import { useEffect } from "react";
// next imports
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// components
import { ProjectCard } from "components/project-card";
// mobx store
import { observer } from "mobx-react-lite";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const WorkspaceProjectPage = observer(() => {
  const store: RootStore = useMobxStore();
  const { project: projectStore } = store;

  const routerParams = useParams();
  const { workspace_slug } = routerParams as { workspace_slug: string };

  useEffect(() => {
    if (workspace_slug) {
      store?.project?.getWorkspaceProjectsListAsync(workspace_slug);
    }
  }, [workspace_slug, store?.project, store?.issue]);

  return (
    <div className="relative w-screen min-h-[500px] h-screen overflow-hidden flex flex-col">
      <div className="flex-shrink-0 h-[60px] border-b border-gray-300 relative flex items-center bg-white select-none">
        <div className="px-5 relative w-full flex items-center gap-2">
          <div className="flex-shrink-0 w-[28px] h-[28px] overflow-hidden">
            <Image src="/plane-logo.webp" alt="plane logo" className="w-[28px] h-[28px]" height="24" width="24" />
          </div>
          <div className="font-medium">Plane Deploy</div>
        </div>
      </div>
      <div className="w-full h-full relative bg-white overflow-hidden">
        <div className="relative w-full h-full overflow-hidden">
          {projectStore?.loader ? (
            <div className="text-sm text-center py-10 text-gray-500">Loading...</div>
          ) : (
            <>
              {projectStore?.error ? (
                <div className="text-sm text-center py-10 text-gray-500">Something went wrong.</div>
              ) : (
                <div className="relative w-full h-full overflow-y-auto">
                  <div className="container mx-auto px-5 py-3">
                    {projectStore?.projectsList && projectStore?.projectsList.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-xl font-medium capitalize">{workspace_slug} Projects</div>
                        <div className="space-y-2">
                          {projectStore?.projectsList.map((_project) => (
                            <div key={_project?.id}>
                              <ProjectCard project={_project} workspace_slug={workspace_slug} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 gap-4 flex flex-col justify-center items-center">
                        <div className="text-sm text-center text-gray-500">
                          No projects are published under this workspace.
                        </div>
                        <a
                          href={`https://app.plane.so/`}
                          className="transition-all border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-800 cursor-pointer p-1.5 px-2.5 rounded-sm text-sm font-medium hover:scale-105 select-none"
                        >
                          Go to your Workspace
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute z-[99999] bottom-[10px] right-[10px] bg-white rounded-sm shadow-lg border border-gray-100">
        <Link href="https://plane.so" className="p-1 px-2 flex items-center gap-1" target="_blank">
          <div className="w-[24px] h-[24px] relative flex justify-center items-center">
            <Image src="/plane-logo.webp" alt="plane logo" className="w-[24px] h-[24px]" height="24" width="24" />
          </div>
          <div className="text-xs">
            Powered by <b>Plane Deploy</b>
          </div>
        </Link>
      </div>
    </div>
  );
});

export default WorkspaceProjectPage;
