"use client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
      {children}
    </div>
  );
}
