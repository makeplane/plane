import "styles/globals.css";
import type { AppProps } from "next/app";

import GlobalContextProvider from "contexts/globalContextProvider";

import CommandPalette from "components/command-palette";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlobalContextProvider>
      <>
        <CommandPalette />
        <Component {...pageProps} />
      </>
    </GlobalContextProvider>
  );
}

export default MyApp;
