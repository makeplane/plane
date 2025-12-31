import { lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import { SWRConfig } from "swr";
// Plane Imports
import { WEB_SWR_CONFIG } from "@plane/constants";
import { TranslationProvider } from "@plane/i18n";
import { Toast } from "@plane/propel/toast";
// helpers
import { resolveGeneralTheme } from "@plane/utils";
// polyfills
import "@/lib/polyfills";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";

// lazy imports
const AppProgressBar = lazy(function AppProgressBar() {
  return import("@/lib/b-progress/AppProgressBar");
});

const StoreWrapper = lazy(function StoreWrapper() {
  return import("@/lib/wrappers/store-wrapper");
});

const InstanceWrapper = lazy(function InstanceWrapper() {
  return import("@/lib/wrappers/instance-wrapper");
});

const ChatSupportModal = lazy(function ChatSupportModal() {
  return import("@/components/global/chat-support-modal");
});

export interface IAppProvider {
  children: React.ReactNode;
}

export function AppProvider(props: IAppProvider) {
  const { children } = props;
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <StoreProvider>
      <>
        <AppProgressBar />
        <TranslationProvider>
          <Toast theme={resolveGeneralTheme(resolvedTheme)} />
          <StoreWrapper>
            <InstanceWrapper>
              <Suspense>
                <ChatSupportModal />
                <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
              </Suspense>
            </InstanceWrapper>
          </StoreWrapper>
        </TranslationProvider>
      </>
    </StoreProvider>
  );
}
