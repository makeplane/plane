// plane imports
import { EUpdateStatus } from "../enums";
import { TUpdate, TUpdateComment, TUpdateReaction } from "./base";

// Define a type for the mandatory epicId in ...args
type InitiativeArgs = [initiativeId: string];
type EpicArgs = [epicId: string];
export type TCommentLoader = "fetch" | "create" | "update" | "delete" | "mutate" | undefined;

export type TUpdateOperations = {
  fetchUpdates?: (params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
  createUpdate: (data: Partial<TUpdate>) => Promise<void>;
  patchUpdate: (updateId: string, data: Partial<TUpdate>) => Promise<void>;
  removeUpdate: (updateId: string) => Promise<void>;
  createComment: (updateId: string, data: Partial<TUpdateComment>) => Promise<void>;
  patchComment: (commentId: string, data: Partial<TUpdateComment>) => Promise<void>;
  removeComment: (updateId: string, commentId: string) => Promise<void>;
  fetchComments: (updateId: string, loaderType: TCommentLoader) => Promise<void>;
  createReaction: (updateId: string, reaction: string) => Promise<void>;
  removeReaction: (updateId: string, reaction: string) => Promise<void>;
};
