"use client";

// root styles
import "styles/globals.css";
// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className="antialiased w-100">
      <MobxStoreProvider>
        <MobxStoreInit />
        <main>{children}</main>
      </MobxStoreProvider>
    </body>
  </html>
);

export default RootLayout;
