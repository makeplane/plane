import Image from "next/image";

// mobx
import { observer } from "mobx-react-lite";
import planeLogo from "public/plane-logo.svg";
// components
import IssueNavbar from "components/issues/navbar";

const ProjectLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-screen min-h-[500px] h-screen overflow-hidden flex flex-col">
    <div className="flex-shrink-0 h-[60px] border-b border-custom-border-300 relative flex items-center bg-custom-sidebar-background-100 select-none">
      <IssueNavbar />
    </div>
    <div className="w-full h-full relative bg-custom-background-90 overflow-hidden">{children}</div>

    <a
      href="https://plane.so"
      className="fixed !z-[999999] bottom-2.5 right-5 bg-custom-background-100 rounded shadow-custom-shadow-2xs border border-custom-border-200 py-1 px-2 flex items-center gap-1"
      target="_blank"
      rel="noreferrer noopener"
    >
      <div className="w-6 h-6 relative grid place-items-center">
        <Image src={planeLogo} alt="Plane logo" className="w-6 h-6" height="24" width="24" />
      </div>
      <div className="text-xs">
        Powered by <span className="font-semibold">Plane Deploy</span>
      </div>
    </a>
  </div>
);

export default observer(ProjectLayout);
