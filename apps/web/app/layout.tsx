import { Metadata, Viewport } from "next";
import Script from "next/script";

// styles
import "@/styles/globals.css";

import { SITE_DESCRIPTION, SITE_NAME } from "@plane/constants";

// helpers
import { cn } from "@plane/utils";

// local
import { AppProvider } from "./provider";
import { KeyboardShortcutProvider } from "../components/keyboard-shortcut-provider";

export const metadata: Metadata = {
  title: "Plane | Simple, extensible, open-source project management tool.",
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://app.plane.so"),
  openGraph: {
    title: "Plane | Simple, extensible, open-source project management tool.",
    description: "Open-source project management tool to manage work items, cycles, and product roadmaps easily",
    url: "https://app.plane.so/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plane - Modern project management",
      },
    ],
  },
  keywords:
    "software development, plan, ship, software, accelerate, code management, release management, project management, work item tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
    card: "summary_large_image",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plane - Modern project management",
      },
    ],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isSessionRecorderEnabled = parseInt(process.env.NEXT_PUBLIC_ENABLE_SESSION_RECORDER || "0");

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#fff" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest.json" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        {/* Meta info for PWA */}
        <meta name="application-name" content="Plane" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div id="context-menu-portal" />
        <div id="editor-portal" />
        <AppProvider>
          {/* <KeyboardShortcutProvider> */}
            <div
              className={cn(
                "h-screen w-full overflow-hidden bg-custom-background-100 relative flex flex-col",
                "app-container"
              )}
            >
              <main className="w-full h-full overflow-hidden relative">{children}</main>
            </div>
          {/* </KeyboardShortcutProvider> */}
        </AppProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🎯 GLOBAL SCRIPT: Loading global Cmd+N handler');
              console.log('🎯 GLOBAL SCRIPT: Script is running at', new Date().toISOString());
              
              // Test if the script is running
              window.testGlobalScript = function() {
                console.log('🎯 GLOBAL SCRIPT: Test function called');
                return 'Global script is working';
              };
              
              // Multiple event listeners with different strategies
              
              // Strategy 1: Cmd+I for creating new work items
              document.addEventListener('keydown', function(e) {
                if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
                  console.log('🎯 DOCUMENT: Cmd+I detected!');
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  window.dispatchEvent(new CustomEvent('plane:open-new-issue', {
                    detail: { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey }
                  }));
                }
              }, { capture: true, passive: false });
              
              // Strategy 2: Window level with capture - Cmd+I
              window.addEventListener('keydown', function(e) {
                if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
                  console.log('🎯 WINDOW: Cmd+I detected!', {
                    key: e.key,
                    metaKey: e.metaKey,
                    ctrlKey: e.ctrlKey,
                    target: e.target?.tagName,
                    timestamp: Date.now()
                  });
                  
                  // Prevent default browser behavior
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  
                  // Try to trigger the create issue modal
                  console.log('🎯 WINDOW: Attempting to create new issue');
                  
                  // Dispatch a custom event that the app can listen for
                  window.dispatchEvent(new CustomEvent('plane:open-new-issue', {
                    detail: { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey }
                  }));
                }
              }, { capture: true, passive: false });
              
              // Strategy 3: Body level with capture - Cmd+I
              document.body.addEventListener('keydown', function(e) {
                if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
                  console.log('🎯 BODY: Cmd+I detected!');
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  window.dispatchEvent(new CustomEvent('plane:open-new-issue', {
                    detail: { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey }
                  }));
                }
              }, { capture: true, passive: false });
              
              // Test: Listen for ANY keydown event to see if our listeners work at all
              document.addEventListener('keydown', function(e) {
                console.log('🎯 TEST: Any keydown detected', e.key, e.metaKey, e.ctrlKey);
              }, { capture: true, passive: false });
              
              console.log('🎯 GLOBAL SCRIPT: Event listeners added');
            `,
          }}
        />
      </body>
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />
      )}
      {!!isSessionRecorderEnabled && process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY && (
        <Script id="clarity-tracking">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];if(y){y.parentNode.insertBefore(t,y);}
          })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY}");`}
        </Script>
      )}
    </html>
  );
}
