import { useEffect } from "react";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export function PageHead(props: PageHeadTitleProps) {
  const { title } = props;

  useEffect(() => {
    if (title) {
      document.title = title ?? "WinSecOps | Simple, extensible, open-source project management tool.";
    }
  }, [title]);

  return null;
}
