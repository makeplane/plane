import { ReactNode } from "react";
import { Metadata } from "next";
// styles
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Plane Admin | Project Management Tool",
  description: "Admin dashboard for Plane project management tool.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
