import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";

const useDraggableInPortal = () => {
  const self = useRef<Element>();

  useEffect(() => {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.pointerEvents = "none";
    div.style.top = "0";
    div.style.width = "100%";
    div.style.height = "100%";
    self.current = div;
    document.body.appendChild(div);
    return () => {
      document.body.removeChild(div);
    };
  }, [self.current]);

  return (render: any) => (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
    const element = render(provided, snapshot);
    if (self.current && snapshot?.isDragging) {
      return createPortal(element, self.current);
    }
    return element;
  };
};

export default useDraggableInPortal;
