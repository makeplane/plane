"use client";
import { IMentionSuggestion } from "@plane/editor";
import { useCallback, useEffect, useRef } from "react";
import { getMentionSuggestions } from "../helpers/mentions-helper";

declare global {
  interface Window {
    getMembers: () => Promise<IMentionSuggestion[]>;
    setMembers: (members: any) => void;
    getUserId: () => void;
  }
}

export const useMentions = () => {
  const mentionSuggestionsRef = useRef<IMentionSuggestion[]>([]);
  const mentionHighlightsRef = useRef<string[]>([]);

  // This callback is provided by the native code to get the members.
  // This is called only once when the editor is loaded.
  const getMembers = useCallback(async (): Promise<IMentionSuggestion[]> => {
    await window.flutter_inappwebview?.callHandler("getMembers").then((members: any) => {
      const mentionSuggestions = getMentionSuggestions(members);
      mentionSuggestionsRef.current = mentionSuggestions;
      return mentionSuggestions;
    });
    return [];
  }, []);

  const setMembers = useCallback((members: any) => {
    const mentionSuggestions = getMentionSuggestions(members);
    mentionSuggestionsRef.current = mentionSuggestions;
  }, []);

  const getUserId = useCallback(
    () =>
      window.flutter_inappwebview
        ?.callHandler("getUserId")
        .then((userId: string) => (mentionHighlightsRef.current = [userId])),
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
