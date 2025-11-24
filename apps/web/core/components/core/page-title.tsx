import { useEffect } from "react";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export function PageHead(props: PageHeadTitleProps) {
  const { title } = props;

  useEffect(() => {
    if (title) {
      document.title = title ?? "Plane | Simple, extensible, open-source project management tool.";
    }
  }, [title]);

  return null;
}
