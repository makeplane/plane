"use client";

// root styles
import "styles/globals.css";

// toast alert
import { ToastContextProvider } from "contexts/toast.context";

// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body data-theme="dark" className="antialiased bg-custom-background-90 w-100">
      <MobxStoreProvider>
        <MobxStoreInit />
        <ToastContextProvider>
          <main>{children}</main>
        </ToastContextProvider>
      </MobxStoreProvider>
    </body>
  </html>
);

export default RootLayout;
