import { FC, ReactNode } from "react";
import dynamic from "next/dynamic";
import Router from "next/router";
import NProgress from "nprogress";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "next-themes";
// mobx store provider
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { THEMES } from "constants/themes";
// layouts
import InstanceLayout from "layouts/instance-layout";
// contexts
import { ToastContextProvider } from "contexts/toast.context";
// dynamic imports
const StoreWrapper = dynamic(() => import("lib/wrappers/store-wrapper"), { ssr: false });
const PosthogWrapper = dynamic(() => import("lib/wrappers/posthog-wrapper"), { ssr: false });
const CrispWrapper = dynamic(() => import("lib/wrappers/crisp-wrapper"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

export interface IAppProvider {
  children: ReactNode;
}

export const AppProvider: FC<IAppProvider> = observer((props) => {
  const { children } = props;
  // store
  const {
    user: { currentUser, currentWorkspaceRole, currentProjectRole },
    appConfig: { envConfig },
  } = useMobxStore();

  return (
    <ThemeProvider themes={THEMES} defaultTheme="system">
      <ToastContextProvider>
        <InstanceLayout>
          <StoreWrapper>
            <CrispWrapper user={currentUser}>
              <PosthogWrapper
                user={currentUser}
                workspaceRole={currentWorkspaceRole}
                projectRole={currentProjectRole}
                posthogAPIKey={envConfig?.posthog_api_key || null}
                posthogHost={envConfig?.posthog_host || null}
              >
                {children}
              </PosthogWrapper>
            </CrispWrapper>
          </StoreWrapper>
        </InstanceLayout>
      </ToastContextProvider>
    </ThemeProvider>
  );
});
