import { stripAndTruncateHTML } from "./string";

export const sanitizeCommentForNotification = (mentionContent: string | undefined) =>
  mentionContent
    ? stripAndTruncateHTML(
        mentionContent.replace(/<mention-component\b[^>]*\blabel="([^"]*)"[^>]*><\/mention-component>/g, "$1")
      )
    : mentionContent;
