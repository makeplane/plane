import Link from "next/link";
import { cn } from "@plane/utils";
import { useParams, usePathname } from "next/navigation";
import { ChatIcon } from "@plane/ui";

const NavItems = () => {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const NAV_ITEMS = [
    {
      label: "Chats",
      href: `/${workspaceSlug}/pi-chat`,
      icon: ChatIcon,
      isActive: `/${workspaceSlug}/pi-chat/` === pathname,
    },
  ];

  return (
    <div className="flex flex-col space-x-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          className={cn(
            "flex text-sm font-medium p-2 text-custom-text-200 truncate rounded-lg hover:text-custom-text-200 hover:bg-custom-background-90 pointer items-center gap-2",
            {
              "hover:bg-custom-primary-100/10 bg-custom-primary-100/10 !text-custom-primary-200": item.isActive,
            }
          )}
          href={item.href}
        >
          <item.icon
            className={cn("flex-shrink-0", {
              // "text-custom-primary-200": item.isActive,
            })}
          />
          <div className="truncate">{item.label}</div>
        </Link>
      ))}
    </div>
  );
};

export default NavItems;
