import { ReactElement } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Router from "next/router";
import { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import NProgress from "nprogress";
// styles
import "styles/globals.css";
import "styles/editor.css";
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
import MobxStoreInit from "lib/mobx/store-init";
// types
import { NextPageWithLayout } from "types/app";

const CrispWithNoSSR = dynamic(() => import("constants/crisp"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

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
            <CrispWithNoSSR />
            <MobxStoreInit />
            {getLayout(<Component {...pageProps} />)}
          </ToastContextProvider>
        </ThemeProvider>
      </MobxStoreProvider>
    </>
  );
}

export default MyApp;
