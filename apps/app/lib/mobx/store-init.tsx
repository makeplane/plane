import { useEffect } from "react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const MobxStoreInit = () => {
  const store: any = useMobxStore();

  useEffect(() => {
    // sidebar collapsed toggle
    if (
      localStorage &&
      localStorage.getItem("app_sidebar_collapsed") &&
      store?.theme?.sidebarCollapsed === null
    )
      store.theme.setSidebarCollapsed(
        localStorage.getItem("app_sidebar_collapsed")
          ? localStorage.getItem("app_sidebar_collapsed") === "true"
            ? true
            : false
          : false
      );

    // theme
    if (localStorage && localStorage.getItem("theme") && store.theme.theme === null)
      store.theme.setTheme(
        localStorage.getItem("theme") ? localStorage.getItem("theme") : "system"
      );
  }, [store?.theme]);

  return <></>;
};

export default MobxStoreInit;
