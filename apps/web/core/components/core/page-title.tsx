import { useEffect } from "react";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export const PageHead: React.FC<PageHeadTitleProps> = (props) => {
  const { title } = props;

  useEffect(() => {
    document.title = title ?? "AHA Projects | Jira Alternative";
  }, [title]);

  return null;
};
