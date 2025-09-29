import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type DrawioDialogWrapperProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

// Try to use #editor-portal, fallback to document.body
const getPortalTarget = () => {
  const portal = document.querySelector("#editor-portal");
  if (portal) {
    return portal;
  }
  return document.body;
};

export const DrawioDialogWrapper: React.FC<DrawioDialogWrapperProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  if (!isOpen) return null;
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div
          className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-[95vw] h-[90vh] max-w-[1400px] max-h-[900px]"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    getPortalTarget()
  );
};
