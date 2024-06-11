import { useEffect } from "react";
import Head from "next/head";

/**
 * Custom hook to set the page title
 * @param title - The title to be set for the page
 */
const usePageTitle = (title?: string) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <Head>
      <title>{title || "Default Title"}</title>
    </Head>
  );
};
export default usePageTitle;
