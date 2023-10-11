import { useEffect } from "react";
// next themes
import { useTheme } from "next-themes";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { useRouter } from "next/router";

const MobxStoreInit = () => {
  const {
    theme: themeStore,
    user: userStore,
    workspace: workspaceStore,
    project: projectStore,
    module: moduleStore,
    globalViews: globalViewsStore,
    projectViews: projectViewsStore,
  } = useMobxStore();
  // theme
  const { setTheme } = useTheme();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId, globalViewId, viewId } = router.query;

  useEffect(() => {
    // sidebar collapsed toggle
    if (localStorage && localStorage.getItem("app_sidebar_collapsed") && themeStore?.sidebarCollapsed === null)
      themeStore.setSidebarCollapsed(
        localStorage.getItem("app_sidebar_collapsed")
          ? localStorage.getItem("app_sidebar_collapsed") === "true"
            ? true
            : false
          : false
      );

    // theme
    if (themeStore.theme === null && userStore?.currentUserSettings) {
      let currentTheme = localStorage.getItem("theme");
      currentTheme = currentTheme && currentTheme != "undefined" ? currentTheme : "system";

      // validating the theme and applying for initial state
      if (currentTheme) {
        setTheme(currentTheme);
        themeStore.setTheme({ theme: { theme: currentTheme } });
      }
    }
  }, [themeStore, userStore, setTheme]);

  useEffect(() => {
    if (workspaceSlug) workspaceStore.setWorkspaceSlug(workspaceSlug.toString());
    if (projectId) projectStore.setProjectId(projectId.toString());
    if (moduleId) moduleStore.setModuleId(moduleId.toString());
    if (globalViewId) globalViewsStore.setGlobalViewId(globalViewId.toString());
    if (viewId) projectViewsStore.setViewId(viewId.toString());
  }, [
    workspaceSlug,
    projectId,
    moduleId,
    globalViewId,
    viewId,
    workspaceStore,
    projectStore,
    moduleStore,
    globalViewsStore,
    projectViewsStore,
  ]);

  return <></>;
};

export default MobxStoreInit;
