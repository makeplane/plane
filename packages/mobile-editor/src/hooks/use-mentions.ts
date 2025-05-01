"use client";
import { useCallback, useEffect, useRef } from "react";
import { transformMentionSuggestions } from "@/helpers/mentions.helper";
import { callNative } from "@/helpers/flutter-callback.helper";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

export const useMentions = () => {
  // Mention suggestions and highlights are stored in refs, so they can be updated without re-initializing the editor.
  const mentionSuggestionsRef = useRef<any[]>([]);
  const mentionHighlightsRef = useRef<string[]>([]);

  // Get the members from the native code.
  const getMembers = useCallback(async (): Promise<any[]> => {
    await callNative(CallbackHandlerStrings.getMembers).then((members: any) => {
      const mentionSuggestions = transformMentionSuggestions(members);
      mentionSuggestionsRef.current = mentionSuggestions;
      return mentionSuggestions;
    });
    return [];
  }, []);

  // Set the members in the mention
  const setMembers = useCallback((members: any) => {
    const mentionSuggestions = transformMentionSuggestions(members);
    mentionSuggestionsRef.current = mentionSuggestions;
  }, []);

  // Get the userId from the native
  const getUserId = useCallback(
    () =>
      callNative(CallbackHandlerStrings.getUserId).then((userId: string) => (mentionHighlightsRef.current = [userId])),
    []
  );

  window.getMembers = getMembers;
  window.setMembers = setMembers;
  window.getUserId = getUserId;

  useEffect(() => {
    getMembers();
    getUserId();
  }, []);

  return {
    mentionSuggestionsRef,
    mentionHighlightsRef,
  };
};
