import type { ReactNode } from "react";

/**
 * Shim for next/head
 * In React Router, use <Meta /> and <Links /> in root.tsx instead
 */
export default function Head({ children }: { children?: ReactNode }) {
  // In React Router, head elements should be handled via meta() export
  // This is a no-op shim for compatibility
  return null;
}
