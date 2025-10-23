import type { Metadata, Viewport } from "next";
import { Outlet } from "react-router";
import { PreloadResources } from "./layout.preload";

// styles
import "@/styles/command-pallette.css";
import "@/styles/emoji.css";
import "@plane/propel/styles/react-day-picker.css";

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

export default function AppLayout() {
  return (
    <>
      <PreloadResources />
      <Outlet />
    </>
  );
}
