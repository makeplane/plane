import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import dynamic from "next/dynamic";
import Router from "next/router";
import { useTheme } from "next-themes";
import NProgress from "nprogress";
import { SWRConfig } from "swr";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "@/constants/swr-config";
//helpers
import { resolveGeneralTheme } from "@/helpers/theme.helper";
// hooks
import { useApplication, useUser, useWorkspace } from "@/hooks/store";
// layouts
import InstanceLayout from "@/layouts/instance-layout";
// dynamic imports
const StoreWrapper = dynamic(() => import("@/lib/wrappers/store-wrapper"), { ssr: false });
const PostHogProvider = dynamic(() => import("@/lib/posthog-provider"), { ssr: false });
const CrispWrapper = dynamic(() => import("@/lib/wrappers/crisp-wrapper"), { ssr: false });
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
