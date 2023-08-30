import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
// styles
import "styles/globals.css";
// contexts
import { ToastContextProvider } from "contexts/toast.context";
// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MobxStoreProvider>
      <MobxStoreInit />
      <ToastContextProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Component {...pageProps} />
        </ThemeProvider>
      </ToastContextProvider>
    </MobxStoreProvider>
  );
}

export default MyApp;
