import { useEffect } from "react";
import { SITE_TITLE } from "@plane/constants";

interface IUseHeadParams {
  title?: string;
}

export const useHead = ({ title }: IUseHeadParams) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    } else {
      document.title = SITE_TITLE;
    }
  }, [title]);
};
