import Link from "next/link";
import router from "next/router";
// helpers
import { cn } from "@/helpers/common.helper";

export const PreferencesMobileHeader = () => {
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
      {profilePreferenceLinks.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className={cn(
            "flex justify-around py-2 w-full",
            router.asPath.includes(link.label.toLowerCase()) ? "border-b-2 border-custom-primary-100" : ""
          )}
        >
          <div className="text-sm text-custom-text-200">{link.label}</div>
        </Link>
      ))}
    </div>
  );
};
