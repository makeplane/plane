import { FC, ReactNode } from "react";
import dynamic from "next/dynamic";
import Router from "next/router";
import NProgress from "nprogress";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useUser, useWorkspace } from "hooks/store";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "constants/swr-config";
// layouts
import InstanceLayout from "layouts/instance-layout";
// contexts
import { SWRConfig } from "swr";
//helpers
import { resolveGeneralTheme } from "helpers/theme.helper";
// dynamic imports
const StoreWrapper = dynamic(() => import("lib/wrappers/store-wrapper"), { ssr: false });
const PostHogProvider = dynamic(() => import("lib/posthog-provider"), { ssr: false });
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
  // store hooks
  const {
    currentUser,
    membership: { currentProjectRole, currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const {
    config: { envConfig },
  } = useApplication();
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      {/* TODO: Need to handle custom themes for toast */}
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      <InstanceLayout>
        <StoreWrapper>
          <CrispWrapper user={currentUser}>
            <PostHogProvider
              user={currentUser}
              currentWorkspaceId={currentWorkspace?.id}
              workspaceRole={currentWorkspaceRole}
              projectRole={currentProjectRole}
              posthogAPIKey={envConfig?.posthog_api_key || null}
              posthogHost={envConfig?.posthog_host || null}
            >
              <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
            </PostHogProvider>
          </CrispWrapper>
        </StoreWrapper>
      </InstanceLayout>
    </>
  );
});
