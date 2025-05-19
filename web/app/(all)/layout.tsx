import { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";

// styles
import "@/styles/command-pallette.css";
import "@/styles/emoji.css";
import "@/styles/react-day-picker.css";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  width: "device-width",
  viewportFit: "cover",
};

// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
const preloadItem = (url: string) => {
  ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
}

const preload = () => {
  const urls = [
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/instances/`,
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/`,
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile/`,
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/settings/`,
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/workspaces/?v=${Date.now()}`,
  ];

  urls.forEach(url => preloadItem(url));
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  preload()
  return (
    <section>{children}</section>
  );
}
