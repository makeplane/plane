import { useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { PiChatLogo } from "@plane/ui";
import { cn } from "@plane/utils";
import { WithFeatureFlagHOC } from "../feature-flags";
import { PiChatBase } from "./base";

export const PiChatFloatingBot = () => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // query params
  const pathName = usePathname();
  const { workspaceSlug } = useParams();

  useOutsideClickDetector(ref, () => {
    setIsOpen(false);
  });

  if (pathName.includes("pi-chat")) return null;

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<></>}>
      <div ref={ref} className="m-auto">
        {" "}
        <button
          className={cn("bg-gradient-to-br rounded-full w-[40px] h-[40px] shadow-md z-[20]", {
            "from-pi-500 to-pi-700": !isOpen,
            "from-pi-200 to-pi-400": isOpen,
          })}
          onClick={() => {
            setIsOpen((state) => !state);
          }}
        >
          {!isOpen ? (
            <PiChatLogo className="size-6 text-white fill-current m-auto align-center" />
          ) : (
            <X className="size-6 text-white fill-current m-auto align-center" />
          )}
        </button>
        <div
          className={cn(
            "absolute bottom-16 right-0 z-[20]",
            "transform transition-all duration-300 ease-in-out",
            isOpen ? "translate-y-[0%] h-[690px]" : "translate-y-[100%] h-0"
          )}
        >
          {isOpen && <PiChatBase />}{" "}
        </div>
      </div>
    </WithFeatureFlagHOC>
  );
};
