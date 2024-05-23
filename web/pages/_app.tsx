import { ReactElement } from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "next-themes";
// styles
import "@/styles/globals.css";
import "@/styles/command-pallette.css";
import "@/styles/nprogress.css";
import "@/styles/emoji.css";
import "@/styles/react-day-picker.css";
// constants
import { SITE_TITLE } from "@/constants/seo-variables";
import { THEMES } from "@/constants/themes";
// mobx store provider
import { AppProvider } from "@/lib/app-provider";
import { StoreProvider } from "@/lib/store-context";
// types
import { NextPageWithLayout } from "@/lib/types";

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
