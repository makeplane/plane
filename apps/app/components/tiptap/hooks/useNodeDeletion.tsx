import { useCallback, useRef } from 'react';
import { Node } from "@tiptap/pm/model";
import { Editor as CoreEditor } from "@tiptap/core";
import { EditorState } from '@tiptap/pm/state';
import fileService from 'services/file.service';

export const useNodeDeletion = () => {
  const previousState = useRef<EditorState>();

  const onNodeDeleted = useCallback(
    async (node: Node) => {
      if (node.type.name === 'image') {
        const assetUrlWithWorkspaceId = new URL(node.attrs.src).pathname.substring(1);
        const resStatus = await fileService.deleteFile(assetUrlWithWorkspaceId);
        if (resStatus === 204) {
          console.log("file deleted successfully");
        }
      }
    },
    [],
  );

  const checkForNodeDeletions = useCallback(
    (editor: CoreEditor) => {
      const prevNodesById: Record<string, Node> = {};
      previousState.current?.doc.forEach((node) => {
        if (node.attrs.id) {
          prevNodesById[node.attrs.id] = node;
        }
      });

      const nodesById: Record<string, Node> = {};
      editor.state?.doc.forEach((node) => {
        if (node.attrs.id) {
          nodesById[node.attrs.id] = node;
        }
      });

      previousState.current = editor.state;

      for (const [id, node] of Object.entries(prevNodesById)) {
        if (nodesById[id] === undefined) {
          onNodeDeleted(node);
        }
      }
    },
    [onNodeDeleted],
  );

  return { checkForNodeDeletions };
};
