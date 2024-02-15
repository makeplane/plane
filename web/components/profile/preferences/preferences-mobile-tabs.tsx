import Link from "next/link";
import router from "next/router";
// helper
import { cn } from "helpers/common.helper";

export const PreferencesMobileTabs = () => {
  const profilePreferenceLinks: Array<{
    label: string;
    href: string;
  }> = [
      {
        label: "Theme",
        href: `/profile/preferences/theme`,
      },
      {
        label: "Email",
        href: `/profile/preferences/email`,
      },
    ];

  return (
    <div className={cn("sticky top-0 flex md:hidden w-full border-b border-custom-border-200")}>
      {profilePreferenceLinks.map((link) => (
        <Link
          href={link.href}
          onClick={() => console.log(router.asPath)}
          className={cn(
            "flex justify-around py-1 w-full",
            router.asPath.includes(link.label.toLowerCase()) ? "border-b border-custom-primary" : ""
          )}
        >
          <div className="text-sm text-custom-text-200">{link.label}</div>
        </Link>
      ))}
    </div>
  );
};
