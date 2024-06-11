import { useEffect } from "react";
import Head from "next/head";

interface IUseHeadParams {
  title?: string;
}

const useHead = ({ title }: IUseHeadParams) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <Head>
      <title>{title || "Plane | Simple, extensible, open-source project management tool."}</title>
    </Head>
  );
};

export default useHead;
