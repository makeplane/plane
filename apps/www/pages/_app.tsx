import type { AppProps } from "next/app";
// n-progress
import NProgress from "@components/nprogress";
// styles
import "@styles/global.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <NProgress />
    </>
  );
}
