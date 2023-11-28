import { ReactNode, useEffect, useState, FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";

interface IStoreWrapper {
  children: ReactNode;
}

const StoreWrapper: FC<IStoreWrapper> = observer((props) => {
  const { children } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, globalViewId, viewId, inboxId, webhookId } = router.query;
  // store
  const {
    theme: { sidebarCollapsed, toggleSidebar },
    user: { currentUser },
    workspace: { setWorkspaceSlug },
    project: { setProjectId },
    cycle: { setCycleId },
    module: { setModuleId },
    globalViews: { setGlobalViewId },
    projectViews: { setViewId },
    inbox: { setInboxId },
    webhook: { setCurrentWebhookId },
    appConfig: { fetchAppConfig },
  } = useMobxStore();
  // fetching application Config
  useSWR("APP_CONFIG", () => fetchAppConfig(), { revalidateIfStale: false, revalidateOnFocus: false });
  // state
  const [dom, setDom] = useState<any>();
  // theme
  const { setTheme } = useTheme();

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) {
      toggleSidebar(localBoolValue);
    }
  }, [sidebarCollapsed, currentUser, setTheme, toggleSidebar]);

  /**
   * Setting up the theme of the user by fetching it from local storage
   */
  useEffect(() => {
    if (!currentUser) return;
    if (window) {
      setDom(window.document?.querySelector<HTMLElement>("[data-theme='custom']"));
    }
    setTheme(currentUser?.theme?.theme || "system");
    if (currentUser?.theme?.theme === "custom" && dom) {
      applyTheme(currentUser?.theme?.palette, false);
    } else unsetCustomCssVariables();
  }, [currentUser, setTheme, dom]);

  /**
   * Setting router info to the respective stores.
   */
  useEffect(() => {
    if (workspaceSlug) setWorkspaceSlug(workspaceSlug.toString());

    setProjectId(projectId?.toString() ?? null);
    setCycleId(cycleId?.toString() ?? null);
    setModuleId(moduleId?.toString() ?? null);
    setGlobalViewId(globalViewId?.toString() ?? null);
    setViewId(viewId?.toString() ?? null);
    setInboxId(inboxId?.toString() ?? null);
    setCurrentWebhookId(webhookId?.toString() ?? undefined);
  }, [
    workspaceSlug,
    projectId,
    cycleId,
    moduleId,
    globalViewId,
    viewId,
    inboxId,
    webhookId,
    setWorkspaceSlug,
    setProjectId,
    setCycleId,
    setModuleId,
    setGlobalViewId,
    setViewId,
    setInboxId,
    setCurrentWebhookId,
  ]);

  return <>{children}</>;
});

export default StoreWrapper;
