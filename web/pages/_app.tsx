import Head from "next/head";
// styles
import "styles/globals.css";
import "styles/editor.css";
import "styles/command-pallette.css";
import "styles/nprogress.css";
import "styles/react-datepicker.css";
// types
import type { AppProps } from "next/app";
// constants
import { SITE_TITLE } from "constants/seo-variables";
//lib
import AppProviders from "lib/app-providers";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
      </Head>
      <AppProviders pageProps={pageProps}>
        <Component {...pageProps} />
      </AppProviders>
    </>
  );
}

export default MyApp;
