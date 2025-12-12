import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  isAuthorized: boolean;
};

export function ProfileNavbar(props: Props) {
  const { isAuthorized } = props;
  const { t } = useTranslation();
  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  return (
    <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false}>
      <div className="flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
            <span
              className={cn(
                `flex whitespace-nowrap border-b-2 p-4 text-13 font-medium outline-none text-tertiary hover:text-primary ${
                  pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`
                    ? "border-accent-strong text-accent-primary hover:text-accent-primary"
                    : "border-transparent"
                }`
              )}
            >
              {t(tab.i18n_label)}
            </span>
          </Link>
        ))}
      </div>
    </Header>
  );
}
