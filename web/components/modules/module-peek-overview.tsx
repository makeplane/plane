import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useModule } from "hooks/store";
// components
import { ModuleDetailsSidebar } from "./sidebar";

type Props = {
  projectId: string;
  workspaceSlug: string;
};

export const ModulePeekOverview: React.FC<Props> = observer(({ projectId, workspaceSlug }) => {
  // router
  const router = useRouter();
  const { peekModule } = router.query;
  // refs
  const ref = React.useRef(null);
  // store hooks
  const { fetchModuleDetails } = useModule();

  const handleClose = () => {
    delete router.query.peekModule;
    router.push({
      pathname: router.pathname,
      query: { ...router.query },
    });
  };

  useEffect(() => {
    if (!peekModule) return;

    fetchModuleDetails(workspaceSlug, projectId, peekModule.toString());
  }, [fetchModuleDetails, peekModule, projectId, workspaceSlug]);

  return (
    <>
      {peekModule && (
        <div
          ref={ref}
          className="flex h-full w-[24rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 py-3.5 duration-300"
          style={{
            boxShadow:
              "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
          }}
        >
          <ModuleDetailsSidebar moduleId={peekModule?.toString() ?? ""} handleClose={handleClose} />
        </div>
      )}
    </>
  );
});
