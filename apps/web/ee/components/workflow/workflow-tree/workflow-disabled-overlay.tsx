import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// community imports
import { TWorkflowDisabledOverlayProps } from "@/ce/components/workflow/workflow-disabled-overlay";
// local imports
import { WorkFlowDisabledMessage } from "./workflow-disabled-message";

// Create a singleton portal node
const getPortalNode = () => {
  if (typeof document === "undefined") return null;

  let node = document.getElementById("workflow-message-portal");
  if (!node) {
    node = document.createElement("div");
    node.id = "workflow-message-portal";
    document.body.appendChild(node);
  }
  return node;
};

export const WorkFlowDisabledOverlay = observer((props: TWorkflowDisabledOverlayProps) => {
  const { messageContainerRef, workflowDisabledSource, shouldOverlayBeVisible } = props;
  // refs
  const workflowMessageRef = useRef<HTMLDivElement>(null);
  // states
  const [messagePosition, setMessagePosition] = useState<{ top: number; left: number } | null>(null);
  const portalNode = useRef(getPortalNode());

  useEffect(() => {
    if (!messageContainerRef.current || !shouldOverlayBeVisible || !workflowDisabledSource) return;

    const updatePosition = () => {
      const containerRect = messageContainerRef.current?.getBoundingClientRect();
      const messageRect = workflowMessageRef.current?.getBoundingClientRect();

      if (containerRect && messageRect) {
        // Calculate center position
        const top = containerRect.top + (containerRect.height - messageRect.height) / 2;
        const left = containerRect.left + (containerRect.width - messageRect.width) / 2;

        setMessagePosition({ top, left });
      }
    };

    // add a small delay to ensure the message is rendered
    const timeoutId = setTimeout(updatePosition, 0);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [messageContainerRef, shouldOverlayBeVisible, workflowDisabledSource]);

  const renderWorkflowMessage = () => {
    if (!workflowDisabledSource || !shouldOverlayBeVisible || !portalNode.current) return null;

    return createPortal(
      <div
        ref={workflowMessageRef}
        style={{
          position: "fixed",
          top: messagePosition?.top ?? 0,
          left: messagePosition?.left ?? 0,
          zIndex: 19, // higher than the overlay and sticky header and top navigation header
          pointerEvents: "none",
          opacity: messagePosition ? 1 : 0, // show only when position is calculated
          transition: "opacity 0.15s ease-in-out",
        }}
      >
        <WorkFlowDisabledMessage parentStateId={workflowDisabledSource} className="my-2" />
      </div>,
      portalNode.current
    );
  };

  return renderWorkflowMessage();
});
