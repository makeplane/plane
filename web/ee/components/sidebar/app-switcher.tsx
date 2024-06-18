import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import PagesImage from "@/public/app-switcher/pages.png";
import ProjectsImage from "@/public/app-switcher/projects.png";

const APPS_LIST = [
  {
    key: "projects",
    label: "Projects",
    image: ProjectsImage,
    href: "/",
  },
  {
    key: "pages",
    label: "Pages",
    image: PagesImage,
    href: "/pages",
  },
];

export const AppSwitcher = () => {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const isPagesApp = pathname.includes(`/${workspaceSlug.toString()}/pages`);

  return (
    <div className="flex my-2 rounded-lg bg-custom-sidebar-background-90 w-full p-1">
      {APPS_LIST.map((app) => (
        <Link
          key={app.key}
          href={`/${workspaceSlug.toString()}${app.href}`}
          className={cn(
            "flex-shrink-0 p-2 rounded-md border-[0.5px] border-transparent w-1/2 flex flex-col items-center gap-1",
            {
              "bg-custom-sidebar-background-100 border-custom-sidebar-border-200 shadow-[-2px_0_8px_rgba(167,169,174,0.15)] shadow-[2px_0_8px_rgba(167,169,174,0.15)]":
                (app.key === "pages" && isPagesApp) || (app.key === "projects" && !isPagesApp),
            }
          )}
        >
          <div className="size-8 grid place-items-center mt-1">
            <Image src={app.image} className="h-8" alt="Plane projects app" />
          </div>
          <p className="text-center text-xs font-medium text-custom-text-300">{app.label}</p>
        </Link>
      ))}
    </div>
  );
};
