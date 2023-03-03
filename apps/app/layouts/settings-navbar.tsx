import Link from "next/link";
import { useRouter } from "next/router";

const SettingsNavbar: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const workspaceLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/settings`,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/settings/members`,
    },
    {
      label: "Billing & Plans",
      href: `/${workspaceSlug}/settings/billing`,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/settings/integrations`,
    },
  ];

  const projectLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/projects/${projectId}/settings`,
    },
    {
      label: "Control",
      href: `/${workspaceSlug}/projects/${projectId}/settings/control`,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
    },
    {
      label: "Features",
      href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
    },
    {
      label: "States",
      href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
    },
    {
      label: "Labels",
      href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/projects/${projectId}/settings/integrations`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {(projectId ? projectLinks : workspaceLinks).map((link) => (
        <Link href={link.href}>
          <a>
            <div
              className={`rounded-3xl border px-5 py-1.5 text-sm sm:px-7 sm:py-2 sm:text-base ${
                router.asPath === link.href
                  ? "border-theme bg-theme text-white"
                  : "border-gray-300 bg-white hover:bg-hover-gray"
              }`}
            >
              {link.label}
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default SettingsNavbar;
