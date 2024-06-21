import { FC } from "react";
// helpers
import { stripAndTruncateHTML } from "@/helpers/string.helper";

type TCommentMentionRenderer = {
  content: string | undefined;
};

export const CommentMentionRenderer: FC<TCommentMentionRenderer> = (props) => {
  const { content } = props;
  if (!content) return <></>;

  const currentContent: string = stripAndTruncateHTML(
    content.replace(/<mention-component\b[^>]*\blabel="([^"]*)"[^>]*><\/mention-component>/g, "$1")
  );

  return <>{currentContent}</>;
};
