import { stripAndTruncateHTML } from "./string.helper";

export const mentionCommentStringValidator = (mentionContent: string | undefined) =>
  mentionContent
    ? stripAndTruncateHTML(
        mentionContent.replace(/<mention-component\b[^>]*\blabel="([^"]*)"[^>]*><\/mention-component>/g, "$1")
      )
    : mentionContent;
