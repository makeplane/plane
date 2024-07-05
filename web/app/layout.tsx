import { Metadata } from "next";
import Script from "next/script";
// styles
import "@/styles/globals.css";
import "@/styles/command-pallette.css";
import "@/styles/emoji.css";
import "@/styles/react-day-picker.css";
// local
import { AppProvider } from "./provider";

export const metadata: Metadata = {
  title: "Plane | Simple, extensible, open-source project management tool.",
  description:
    "Open-source project management tool to manage issues, sprints, and product roadmaps with peace of mind.",
  openGraph: {
    title: "Plane | Simple, extensible, open-source project management tool.",
    description: "Plane Deploy is a customer feedback management tool built on top of plane.so",
    url: "https://app.plane.so/",
  },
  keywords:
    "software development, plan, ship, software, accelerate, code management, release management, project management, issue tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isSessionRecorderEnabled = parseInt(process.env.NEXT_PUBLIC_ENABLE_SESSION_RECORDER || "0");

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#fff" />
        <link rel="apple-touch-icon" sizes="512x512" href="/plane-logos/plane-mobile-pwa.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest.json" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
      </head>
      <body>
        <div id="context-menu-portal" />
        <AppProvider>
          <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>{children}</div>
        </AppProvider>
      </body>
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />
      )}
      {!!isSessionRecorderEnabled && process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY && (
        <Script id="clarity-tracking">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY}");`}
        </Script>
      )}
    </html>
  );
}
