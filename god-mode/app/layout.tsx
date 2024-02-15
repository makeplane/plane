// lib
import { ThemeProvider } from "lib/theme-provider";
import { ToastContextProvider } from "lib/toast-provider";
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

export const RootLayout = async ({ children }: RootLayoutProps) => {
  const isUserInstanceAdmin = true;
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {/* <AuthWrapper> */}
        {/* {isUserInstanceAdmin || true ? ( */}
        <ThemeProvider
          themes={["light", "dark"]}
          defaultTheme="system"
          enableSystem
        >
          <ToastContextProvider>
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
          </ToastContextProvider>
        </ThemeProvider>
        {/* ) : (
          <div>Login</div>
        )} */}
      </body>
    </html>
  );
};

export default RootLayout;
