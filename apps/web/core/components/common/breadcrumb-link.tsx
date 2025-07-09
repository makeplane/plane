"use client";

import React, { ReactNode, useMemo, FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Breadcrumbs } from "@plane/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  disableTooltip?: boolean;
  isLast?: boolean;
};

const IconWrapper = React.memo(({ icon }: { icon: React.ReactNode }) => (
  <div className="flex size-4 items-center justify-center overflow-hidden !text-[1rem]">{icon}</div>
));

IconWrapper.displayName = "IconWrapper";

const LabelWrapper = React.memo(({ label }: { label: ReactNode }) => (
  <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
));

LabelWrapper.displayName = "LabelWrapper";

const BreadcrumbContent = React.memo(({ icon, label }: { icon?: React.ReactNode; label?: ReactNode }) => {
  if (!icon && !label) return null;

  return (
    <>
      {icon && <IconWrapper icon={icon} />}
      {label && <LabelWrapper label={label} />}
    </>
  );
});

BreadcrumbContent.displayName = "BreadcrumbContent";

const ItemWrapper = React.memo(({ children, ...props }: React.ComponentProps<typeof Breadcrumbs.ItemWrapper>) => (
  <Breadcrumbs.ItemWrapper {...props}>{children}</Breadcrumbs.ItemWrapper>
));

ItemWrapper.displayName = "ItemWrapper";

export const BreadcrumbLink: FC<Props> = observer((props) => {
  const { href, label, icon, disableTooltip = false, isLast = false } = props;
  const { isMobile } = usePlatformOS();

  const itemWrapperProps = useMemo(
    () => ({
      label: label?.toString(),
      disableTooltip: isMobile || disableTooltip,
      type: (href && href !== "" ? "link" : "text") as "link" | "text",
      isLast,
    }),
    [href, label, isMobile, disableTooltip, isLast]
  );

  const content = useMemo(() => <BreadcrumbContent icon={icon} label={label} />, [icon, label]);

  if (href) {
    return (
      <Link href={href}>
        <ItemWrapper {...itemWrapperProps}>{content}</ItemWrapper>
      </Link>
    );
  }

  return <ItemWrapper {...itemWrapperProps}>{content}</ItemWrapper>;
});

BreadcrumbLink.displayName = "BreadcrumbLink";
