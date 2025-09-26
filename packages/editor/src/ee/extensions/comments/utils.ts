import { ECommentAttributeNames } from "./types";

export const getCommentSelector = (commentId: string) => `[${ECommentAttributeNames.COMMENT_ID}=${commentId}]`;
