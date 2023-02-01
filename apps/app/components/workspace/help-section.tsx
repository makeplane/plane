import { useState, useRef, FC } from "react";
import { Transition } from "@headlessui/react";
import Link from "next/link";
// icons
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import {
  QuestionMarkCircleIcon,
  BoltIcon,
  DocumentIcon,
  DiscordIcon,
  GithubIcon,
  CommentIcon,
} from "components/icons";
// hooks
import useTheme from "hooks/use-theme";
import useOutsideClickDetector from "hooks/use-outside-click-detector";

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: DocumentIcon,
  },
  {
    name: "Join our Discord",
    href: "https://discord.com/invite/A92xrEGCge",
    Icon: DiscordIcon,
  },
  {
    name: "Report a bug",
    href: "https://github.com/makeplane/plane/issues/new/choose",
    Icon: GithubIcon,
  },
  {
    name: "Chat with us",
    href: "mailto:hello@plane.so",
    Icon: CommentIcon,
  },
];

export interface WorkspaceHelpSectionProps {
  setSidebarActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WorkspaceHelpSection: FC<WorkspaceHelpSectionProps> = (props) => {
  const { setSidebarActive } = props;
  // theme
  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);
  // hooks
  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  const helpOptionMode = sidebarCollapse ? "left-full" : "left-[-75px]";

  return (
    <div
      className={`flex w-full items-center justify-between self-baseline bg-primary px-2 py-2 ${
        sidebarCollapse ? "flex-col-reverse" : ""
      }`}
    >
      <button
        type="button"
        className={`hidden items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 md:flex ${
          sidebarCollapse ? "w-full justify-center" : ""
        }`}
        onClick={() => toggleCollapsed()}
      >
        <ArrowLongLeftIcon
          className={`h-4 w-4 flex-shrink-0 text-gray-500 duration-300 group-hover:text-gray-900 ${
            sidebarCollapse ? "rotate-180" : ""
          }`}
        />
      </button>
      <button
        type="button"
        className="flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 md:hidden"
        onClick={() => setSidebarActive(false)}
      >
        <ArrowLongLeftIcon className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-gray-900" />
      </button>
      <button
        type="button"
        className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
          sidebarCollapse ? "w-full justify-center" : ""
        }`}
        onClick={() => {
          const e = new KeyboardEvent("keydown", {
            ctrlKey: true,
            key: "h",
          });
          document.dispatchEvent(e);
        }}
        title="Help"
      >
        <BoltIcon className="h-4 w-4 text-gray-500" />
        {!sidebarCollapse && <span>Shortcuts</span>}
      </button>
      <div className="relative">
        <Transition
          show={isNeedHelpOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className={`absolute bottom-2 ${helpOptionMode}  space-y-2 rounded-sm bg-white py-3 shadow-md`}
            ref={helpOptionsRef}
          >
            {helpOptions.map(({ name, Icon, href }) => (
              <Link href={href} key={name}>
                <a
                  target="_blank"
                  className="mx-3 flex items-center gap-x-2 rounded-md whitespace-nowrap  px-2 py-2 text-xs hover:bg-gray-100"
                >
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">{name}</span>
                </a>
              </Link>
            ))}
          </div>
        </Transition>
        <button
          type="button"
          className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
            sidebarCollapse ? "w-full justify-center" : ""
          }`}
          onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          title="Help"
        >
          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />
          {!sidebarCollapse && <span>Help ?</span>}
        </button>
      </div>
    </div>
  );
};
