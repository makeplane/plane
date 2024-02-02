import "./globals.css";
import { ThemeProvider } from "lib/theme-provider";
// components
import { InstanceSidebar } from "./sidebar";
import { InstanceHeader } from "./header";

export const metadata = {
  title: "God Mode",
  description: "You are god now.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const fetchAdminInfo = async () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(BASE_URL + "/api/users/me/instance-admin/");
  const data = await res.json();
  return data;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const response = await fetchAdminInfo();
  console.log(response);

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {/* <AuthWrapper> */}
        {/* {response?.is_instance_admin ? (
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
          </ThemeProvider>
        ) : (
          <div>Login</div>
        )} */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
