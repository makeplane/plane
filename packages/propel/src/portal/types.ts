import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import type { EPortalWidth, EPortalPosition } from "./constants";

export interface BasePortalProps {
  children: ReactNode;
  className?: string;
}

export interface PortalWrapperProps extends BasePortalProps {
  portalId?: string;
  fallbackToDocument?: boolean;
  onMount?: () => void;
  onUnmount?: () => void;
}

export interface ModalPortalProps extends BasePortalProps {
  isOpen: boolean;
  onClose?: () => void;
  portalId?: string;
  overlayClassName?: string;
  contentClassName?: string;
  width?: EPortalWidth;
  position?: EPortalPosition;
  fullScreen?: boolean;
  showOverlay?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export type PortalEventHandler = () => void;
export type PortalKeyboardHandler = (event: KeyboardEvent) => void;
export type PortalMouseHandler = (event: ReactMouseEvent) => void;
