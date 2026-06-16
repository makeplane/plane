import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { IntakeIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const ChangeHeader = observer(() => {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const links = [
    { label: "Overview", href: `/${workspaceSlug}/change/overview` },
    { label: "Open", href: `/${workspaceSlug}/change/open` },
    { label: "Closed", href: `/${workspaceSlug}/change/closed` },
    { label: "All", href: `/${workspaceSlug}/change/all` },
  ];

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Change Management"
                  icon={<IntakeIcon className="size-5 text-secondary" />}
                />
              }
            />
          </Breadcrumbs>
          <div className="flex items-center gap-1 border-l border-custom-border-200 pl-4">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-custom-background-80 text-custom-text-100"
                        : "text-custom-text-200 hover:bg-custom-background-80 hover:text-custom-text-100"
                    }`}
                  >
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Header.LeftItem>

      <Header.RightItem>
        <Link href={`/${workspaceSlug}/change/create-new`}>
          <Button variant="primary" size="lg">
            <Plus className="h-4 w-4" />
            New Change
          </Button>
        </Link>
      </Header.RightItem>
    </Header>
  );
});
