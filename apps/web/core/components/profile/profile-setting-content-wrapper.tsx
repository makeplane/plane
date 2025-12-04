import { cn } from "@plane/utils";
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function ProfileSettingContentWrapper(props: Props) {
  const { children, className = "" } = props;
  return (
    <div className="flex h-full flex-col">
      <div className="block flex-shrink-0 border-b border-subtle p-4 md:hidden">
        <SidebarHamburgerToggle />
      </div>

      <div
        className={cn(
          "vertical-scrollbar scrollbar-md mx-auto h-full w-full flex flex-col px-8 md:px-20 lg:px-36 xl:px-56 py-10 md:py-16",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
