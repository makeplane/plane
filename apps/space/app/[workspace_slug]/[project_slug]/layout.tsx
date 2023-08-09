"use client";

// components
import IssueNavbar from "components/issues/navbar";
import IssueFilter from "components/issues/filters";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-w-[780px] w-screen min-h-[500px] h-screen overflow-hidden flex flex-col">
    <div className="flex-shrink-0 h-[60px] border-b border-gray-300 relative flex items-center bg-white">
      <IssueNavbar />
    </div>
    <div className="flex-shrink-0 min-h-[50px] h-auto py-1.5 border-b border-gray-300 relative flex items-center shadow-md bg-white">
      <IssueFilter />
    </div>
    <div className="w-full h-full relative bg-gray-100">{children}</div>
  </div>
);

export default RootLayout;
