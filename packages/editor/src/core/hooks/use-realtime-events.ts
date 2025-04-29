import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useEffect } from "react";
import { TCollaborator } from "@plane/types";
import { EventToPayloadMap, ICollaborativeDocumentEditor, BroadcastedEventUnion } from "@/types";

export const useRealtimeEvents = (props: {
  editor: Editor | null;
  provider: HocuspocusProvider;
  id: string;
  updatePageProperties: ICollaborativeDocumentEditor["updatePageProperties"];
}) => {
  const { editor, updatePageProperties, provider, id } = props;

  const collaboratorState = useEditorState({
    editor,
    selector: (ctx) => ({
      users: (ctx?.editor?.storage?.collaborationCursor?.users as TCollaborator[]) || [],
    }),
  });

  // Update page properties when collaborators change
  useEffect(() => {
    if (!collaboratorState?.users || !updatePageProperties) return;

    const currentUsers = collaboratorState.users;

    const collaboratorPayload: EventToPayloadMap["collaborators-updated"] = {
      users: currentUsers,
      user_id: editor?.storage?.collaborationCursor?.clientId,
    };

    updatePageProperties(id, "collaborators-updated", collaboratorPayload, false);
  }, [collaboratorState?.users, updatePageProperties, id, editor]);

  useEffect(() => {
    if (!editor) return;

    const handleStatelessMessage = (payload: { payload: string }) => {
      try {
        // Parse the payload as our BroadcastPayloadUnion
        const event = JSON.parse(payload.payload as string) as BroadcastedEventUnion;

        if (!updatePageProperties) return;

        if (event.action === "moved_internally") {
          const movedPageId = event.affectedPages.currentPage;

          if (movedPageId) {
            const partialData: Partial<EventToPayloadMap["moved_internally"]> = {
              parent_id: event.data.new_parent_id, // Properly typed!
            };
            updatePageProperties(movedPageId, event.action, partialData, true);
          }

          if (event.data.new_parent_id) {
            const parentUpdateData: Partial<EventToPayloadMap["moved_internally"]> = {
              sub_pages_count: 1,
            };
            updatePageProperties(event.data.new_parent_id, event.action, parentUpdateData, true);
          }

          if (event.data.old_parent_id) {
            const oldParentUpdateData: Partial<EventToPayloadMap["moved_internally"]> = {
              sub_pages_count: -1,
            };
            updatePageProperties(event.data.old_parent_id, event.action, oldParentUpdateData, true);
          }
          return;
        }

        if (event.action === "title_updated") {
          const currentPage = event.affectedPages.currentPage;

          if (event.data.title != null && currentPage) {
            updatePageProperties(currentPage, event.action, event.data, true);
          }
          return;
        }

        // For all other events, update affected pages
        const pageIdsToUpdate = [event.affectedPages.currentPage, ...(event.affectedPages.descendantPages ?? [])];

        updatePageProperties(pageIdsToUpdate, event.action, event.data, false);
      } catch (e) {
        console.log("error parsing message", e);
      }
    };

    provider?.on("stateless", handleStatelessMessage);

    return () => {
      provider?.off("stateless", handleStatelessMessage);
    };
  }, [editor, id, provider, updatePageProperties]);
};
