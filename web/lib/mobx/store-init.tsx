import { useEffect } from "react";
// next themes
import { useTheme } from "next-themes";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const MobxStoreInit = () => {
  const store: any = useMobxStore();
  const { setTheme } = useTheme();

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
    if (store.theme.theme === null && store?.user?.currentUserSettings) {
      let currentTheme = localStorage.getItem("theme");
      currentTheme = currentTheme ? currentTheme : "system";

      // validating the theme and applying for initial state
      if (currentTheme) {
        setTheme(currentTheme);
        store.theme.setTheme({ theme: { theme: currentTheme } });
      }
    }
  }, [store?.theme, store?.user, setTheme]);

  useEffect(() => {
    // current user
    if (store?.user?.currentUser === null) store.user.setCurrentUser();

    // current user settings
    if (store?.user?.currentUserSettings === null) store.user.setCurrentUserSettings();
  }, [store?.user]);

  return <></>;
};

export default MobxStoreInit;
