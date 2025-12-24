import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Tooltip } from "@plane/propel/tooltip";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  href: string;
  title: string;
  icon: React.ReactNode;
};

export const FavoriteItemTitle = observer(function FavoriteItemTitle(props: Props) {
  const { href, title, icon } = props;
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const handleOnClick = () => {
    if (isMobile) toggleSidebar();
  };

  return (
    <Tooltip tooltipContent={title} isMobile={isMobile} position="right" className="ml-8">
      <Link href={href} className="flex items-center gap-1.5 truncate w-full" draggable onClick={handleOnClick}>
        <span className="flex items-center justify-center size-5">{icon}</span>
        <span className="text-13 leading-5 font-medium flex-1 truncate">{title}</span>
      </Link>
    </Tooltip>
  );
});
