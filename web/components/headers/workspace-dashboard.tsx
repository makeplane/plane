import { useState } from "react";
import { LayoutGrid, Zap } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// components
import { ProductUpdatesModal } from "components/common";

export const WorkspaceDashboardHeader = () => {
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] = useState(false);
  // theme
  const { resolvedTheme } = useTheme();

  return (
    <>
      <ProductUpdatesModal isOpen={isProductUpdatesModalOpen} setIsOpen={setIsProductUpdatesModalOpen} />
      <div
        className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
      >
        <div className="flex items-center gap-2 pl-3">
          <LayoutGrid size={14} strokeWidth={2} />
          Dashboard
        </div>
        <div className="flex items-center gap-3 px-3">
          <button
            onClick={() => setIsProductUpdatesModalOpen(true)}
            className="flex items-center gap-1.5 bg-custom-background-80 text-xs font-medium py-1.5 px-3 rounded"
          >
            <Zap size={14} strokeWidth={2} fill="rgb(var(--color-text-100))" />
            {"What's New?"}
          </button>
          <a
            className="flex items-center gap-1.5 bg-custom-background-80 text-xs font-medium py-1.5 px-3 rounded"
            href="https://github.com/makeplane/plane"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={resolvedTheme === "dark" ? githubWhiteImage : githubBlackImage}
              height={16}
              width={16}
              alt="GitHub Logo"
            />
            Star us on GitHub
          </a>
        </div>
      </div>
    </>
  );
};
