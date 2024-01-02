import { ReactElement } from "react";
import Head from "next/head";
import { AppProps } from "next/app";
// styles
import "styles/globals.css";
import "styles/command-pallette.css";
import "styles/nprogress.css";
import "styles/react-datepicker.css";
// constants
import { SITE_TITLE } from "constants/seo-variables";
// mobx store provider
import { StoreProvider } from "contexts/store-context";

import { AppProvider } from "lib/app-provider";
// types
import { NextPageWithLayout } from "lib/types";

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
      <StoreProvider {...pageProps}>
        <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
      </StoreProvider>
    </>
  );
}

export default MyApp;
