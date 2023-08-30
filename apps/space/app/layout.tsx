"use client";

// root styles
import "styles/globals.css";

// next theme
import { ThemeProvider } from "next-themes";

// toast alert
import { ToastContextProvider } from "contexts/toast.context";

// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="antialiased bg-custom-background-90 w-100">
      <MobxStoreProvider>
        <MobxStoreInit />
        <ToastContextProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <main>{children}</main>
          </ThemeProvider>
        </ToastContextProvider>
      </MobxStoreProvider>
    </body>
  </html>
);

export default RootLayout;
