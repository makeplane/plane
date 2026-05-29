import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { useCallback, useRef } from "react";

/**
 * Creates a title editor extension that enables keyboard navigation to the main editor
 *
 * @param getMainEditor Function to get the main editor instance
 * @returns A Tiptap extension with keyboard shortcuts
 */
export const createTitleNavigationExtension = (getMainEditor: () => Editor | null) =>
  Extension.create({
    name: "titleEditorNavigation",
    priority: 10,

    addKeyboardShortcuts() {
      return {
        // Arrow down at end of title - Move to main editor
        ArrowDown: () => {
          const mainEditor = getMainEditor();
          if (!mainEditor) return false;

          // If cursor is at the end of the title
          mainEditor.commands.focus("start");
          return true;
        },

        // Right arrow at end of title - Move to main editor
        ArrowRight: ({ editor: titleEditor }) => {
          const mainEditor = getMainEditor();
          if (!mainEditor) return false;

          const { from, to } = titleEditor.state.selection;
          const documentLength = titleEditor.state.doc.content.size;

          // If cursor is at the end of the title
          if (from === to && to === documentLength - 1) {
            mainEditor.commands.focus("start");
            return true;
          }
          return false;
        },

        // Enter - Create new line in main editor and focus
        Enter: () => {
          const mainEditor = getMainEditor();
          if (!mainEditor) return false;

          // Focus at the start of the main editor
          mainEditor.chain().focus().insertContentAt(0, { type: "paragraph" }).run();
          return true;
        },
      };
    },
  });

/**
 * Creates a main editor extension that enables keyboard navigation to the title editor
 *
 * @param getTitleEditor Function to get the title editor instance
 * @returns A Tiptap extension with keyboard shortcuts
 */
export const createMainNavigationExtension = (getTitleEditor: () => Editor | null) =>
  Extension.create({
    name: "mainEditorNavigation",
    priority: 10,

    addKeyboardShortcuts() {
      return {
        // Arrow up at start of main editor - Move to title editor
        ArrowUp: ({ editor: mainEditor }) => {
          const titleEditor = getTitleEditor();
          if (!titleEditor) return false;

          const { from, to } = mainEditor.state.selection;

          // If cursor is at the start of the main editor
          if (from === 1 && to === 1) {
            titleEditor.commands.focus("end");
            return true;
          }
          return false;
        },

        // Left arrow at start of main editor - Move to title editor
        ArrowLeft: ({ editor: mainEditor }) => {
          const titleEditor = getTitleEditor();
          if (!titleEditor) return false;

          const { from, to } = mainEditor.state.selection;

          // If cursor is at the absolute start of the main editor
          if (from === 1 && to === 1) {
            titleEditor.commands.focus("end");
            return true;
          }
          return false;
        },

        // Backspace - Special handling for first paragraph
        Backspace: ({ editor }) => {
          const titleEditor = getTitleEditor();
          if (!titleEditor) return false;

          const { from, to, empty } = editor.state.selection;

          // Only handle when cursor is at position 1 with empty selection
          if (from === 1 && to === 1 && empty) {
            const firstNode = editor.state.doc.firstChild;

            // If first node is a paragraph
            if (firstNode && firstNode.type.name === "paragraph") {
              // If paragraph is already empty, delete it and focus title editor
              if (firstNode.content.size === 0) {
                editor.commands.deleteNode("paragraph");
                // Use setTimeout to ensure the node is deleted before changing focus
                setTimeout(() => titleEditor.commands.focus("end"), 0);
                return true;
              }
              // If paragraph is not empty, just move focus to title editor
              else {
                titleEditor.commands.focus("end");
                return true;
              }
            }
          }
          return false;
        },
      };
    },
  });

/**
 * Hook to manage navigation between title and main editors
 *
 * Creates extension factories for keyboard navigation between editors
 * and maintains references to both editors
 *
 * @returns Object with editor setters and extensions
 */
export const useEditorNavigation = () => {
  // Create refs to store editor instances
  const titleEditorRef = useRef<Editor | null>(null);
  const mainEditorRef = useRef<Editor | null>(null);

  // Create stable getter functions
  const getTitleEditor = useCallback(() => titleEditorRef.current, []);
  const getMainEditor = useCallback(() => mainEditorRef.current, []);

  // Create stable setter functions
  const setTitleEditor = useCallback((editor: Editor | null) => {
    titleEditorRef.current = editor;
  }, []);

  const setMainEditor = useCallback((editor: Editor | null) => {
    mainEditorRef.current = editor;
  }, []);

  // Create extension factories that access editor refs
  const titleNavigationExtension = createTitleNavigationExtension(getMainEditor);
  const mainNavigationExtension = createMainNavigationExtension(getTitleEditor);

  return {
    setTitleEditor,
    setMainEditor,
    titleNavigationExtension,
    mainNavigationExtension,
  };
};
