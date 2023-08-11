"use client";

// components
import IssueNavbar from "components/issues/navbar";
import IssueFilter from "components/issues/filters-render";

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-screen min-h-[500px] h-screen overflow-hidden flex flex-col">
    <div className="flex-shrink-0 h-[60px] border-b border-gray-300 relative flex items-center bg-white select-none">
      <IssueNavbar />
    </div>
    {/* <div className="flex-shrink-0 min-h-[50px] h-auto py-1.5 border-b border-gray-300 relative flex items-center shadow-md bg-white select-none">
      <IssueFilter />
    </div> */}
    <div className="w-full h-full relative bg-gray-100/50 overflow-hidden">{children}</div>
  </div>
);

export default RootLayout;
