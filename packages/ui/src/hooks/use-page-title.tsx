import { useEffect } from "react";

interface IUseHeadParams {
  title?: string;
}

export const useHead = ({ title }: IUseHeadParams) => {
  useEffect(() => {
    if (title) {
      document.title = title ?? "ReyFlow | Simple, extensible, open-source project management tool.";
    }
  }, [title]);
};
