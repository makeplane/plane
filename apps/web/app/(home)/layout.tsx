import { Metadata, Viewport } from "next";

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

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
