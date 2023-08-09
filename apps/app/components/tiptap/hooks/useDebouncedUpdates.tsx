import { useDebouncedCallback } from 'use-debounce';
import { Editor as CoreEditor } from "@tiptap/core";

type DebouncedUpdatesProps = {
  onChange?: (json: any, html: string) => void;
  editor: CoreEditor | null;
};

export const useDebouncedUpdates = (props: DebouncedUpdatesProps) =>
  useDebouncedCallback(async () => {
    setTimeout(async () => {
      if (props.onChange) {
        props.onChange(props.editor.getJSON(), props.editor.getHTML());
      }
    }, 500);
  }, 1000);
;

