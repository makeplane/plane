import type { Metadata, Viewport } from "next";
import { Outlet } from "react-router";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: false,
  },
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default function HomeLayout() {
  return <Outlet />;
}
