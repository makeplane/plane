import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  editor: Editor;
  nodeId: string;
};

export function ImageUploadStatus(props: Props) {
  const { editor, nodeId } = props;
  // Displayed status that will animate smoothly
  const [displayStatus, setDisplayStatus] = useState(0);
  // Animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);
  // subscribe to image upload status
  const uploadStatus: number | undefined = useEditorState({
    editor,
    selector: ({ editor }) => editor.storage.utility?.assetsUploadStatus?.[nodeId],
  });

  useEffect(() => {
    const animateToValue = (start: number, end: number, startTime: number) => {
      const duration = 200;

      const animation = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        // Calculate current display value
        const currentValue = Math.floor(start + (end - start) * easeOutCubic);
        setDisplayStatus(currentValue);

        // Continue animation if not complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame((time) => animation(time));
        }
      };
      animationFrameRef.current = requestAnimationFrame((time) => animation(time));
    };
    animateToValue(displayStatus, uploadStatus == undefined ? 100 : uploadStatus, performance.now());

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [displayStatus, uploadStatus]);

  if (uploadStatus === undefined) return null;

  return (
    <div className="absolute top-1 right-1 z-20 bg-black/60 rounded-sm text-11 font-medium w-10 text-center">
      {displayStatus}%
    </div>
  );
}
