import { ThemeProvider } from "next-themes";
import { AppProps } from "next/app";
import Head from "next/head";
import { ReactElement } from "react";
// styles
import "styles/command-pallette.css";
import "styles/emoji.css";
import "styles/globals.css";
import "styles/nprogress.css";
import "styles/react-day-picker.css";
// constants
import { SITE_TITLE } from "constants/seo-variables";
import { THEMES } from "constants/themes";
// mobx store provider
import { StoreProvider } from "contexts/store-context";
// lib
import { AppProvider } from "lib/app-provider";
// types
import { NextPageWithLayout } from "lib/types";

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps: { ...pageProps } }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
      </Head>
      <StoreProvider {...pageProps}>
        <ThemeProvider themes={THEMES} defaultTheme="system">
          <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
        </ThemeProvider>
      </StoreProvider>
    </>
  );
}

export default MyApp;
