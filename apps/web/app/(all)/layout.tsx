import type { Metadata, Viewport } from "next";

import { PreloadResources } from "./layout.preload";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreloadResources />
      {children}
    </>
  );
}
