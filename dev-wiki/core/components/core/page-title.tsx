import { useEffect } from "react";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export const PageHead: React.FC<PageHeadTitleProps> = (props) => {
  const { title } = props;

  useEffect(() => {
    if (title) {
      document.title = title ?? "Plane | Simple, extensible, open-source project management tool.";
    }
  }, [title]);

  return null;
};
