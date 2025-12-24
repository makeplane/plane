import React, { useMemo } from "react";
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

const IconWrapper = React.memo(function IconWrapper({ icon }: { icon: React.ReactNode }) {
  return <div className="flex size-4 items-center justify-center overflow-hidden !text-16">{icon}</div>;
});

IconWrapper.displayName = "IconWrapper";

const LabelWrapper = React.memo(function LabelWrapper({ label }: { label: React.ReactNode }) {
  return <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate text-primary">{label}</div>;
});

LabelWrapper.displayName = "LabelWrapper";

const BreadcrumbContent = React.memo(function BreadcrumbContent({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label?: React.ReactNode;
}) {
  if (!icon && !label) return null;

  return (
    <>
      {icon && <IconWrapper icon={icon} />}
      {label && <LabelWrapper label={label} />}
    </>
  );
});

BreadcrumbContent.displayName = "BreadcrumbContent";

const ItemWrapper = React.memo(function ItemWrapper({
  children,
  ...props
}: React.ComponentProps<typeof Breadcrumbs.ItemWrapper>) {
  return <Breadcrumbs.ItemWrapper {...props}>{children}</Breadcrumbs.ItemWrapper>;
});

ItemWrapper.displayName = "ItemWrapper";

export const BreadcrumbLink = observer(function BreadcrumbLink(props: Props) {
  const { href, label, icon, disableTooltip = false, isLast = false } = props;
  const { isMobile } = usePlatformOS();

  const itemWrapperProps = useMemo(
    (): Omit<React.ComponentProps<typeof ItemWrapper>, "children"> => ({
      label: label?.toString(),
      disableTooltip: isMobile || disableTooltip,
      type: href && href !== "" ? "link" : "text",
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
