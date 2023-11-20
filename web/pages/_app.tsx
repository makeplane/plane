import { ReactElement } from "react";
import Head from "next/head";
import { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
// styles
import "styles/globals.css";
import "styles/editor.css";
import "styles/table.css";
import "styles/command-pallette.css";
import "styles/nprogress.css";
import "styles/react-datepicker.css";
// contexts
import { ToastContextProvider } from "contexts/toast.context";
// constants
import { THEMES } from "constants/themes";
import { SITE_TITLE } from "constants/seo-variables";
// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import { AppProvider } from "lib/app-provider";
// types
import { NextPageWithLayout } from "types/app";

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
      </Head>
      <MobxStoreProvider {...pageProps}>
        <ThemeProvider themes={THEMES} defaultTheme="system">
          <ToastContextProvider>
            <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
          </ToastContextProvider>
        </ThemeProvider>
      </MobxStoreProvider>
    </>
  );
}

export default MyApp;
