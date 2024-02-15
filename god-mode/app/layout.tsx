// lib
import AppWrapper from "lib/wrappers/app-wrapper";
import { UserAuthWrapper } from "lib/wrappers/user-auth-wrapper";
// components
import { InstanceSidebar } from "./sidebar";
import { InstanceHeader } from "./header";
// styles
import "./globals.css";

export const metadata = {
  title: "God Mode",
  description: "You are god now.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout = async ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body className={`antialiased`}>
      <AppWrapper>
        <UserAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <InstanceSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              <InstanceHeader />
              <div className="h-full w-full overflow-hidden px-10 py-12">
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </UserAuthWrapper>
      </AppWrapper>
    </body>
  </html>
);

export default RootLayout;
