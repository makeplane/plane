import Link from "next/link";
import { cn } from "@plane/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AppSidebarItemData {
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

interface AppSidebarItemProps {
  variant?: "link" | "button";
  item?: AppSidebarItemData;
}

interface AppSidebarItemLabelProps {
  highlight?: boolean;
  label?: string;
}

interface AppSidebarItemIconProps {
  icon?: React.ReactNode;
  highlight?: boolean;
}

interface AppSidebarLinkItemProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

interface AppSidebarButtonItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  base: "group flex flex-col gap-0.5 items-center justify-center text-custom-text-300",
  icon: "flex items-center justify-center gap-2 size-8 rounded-md text-custom-text-300",
  iconActive: "bg-custom-background-80 text-custom-text-200",
  iconInactive: "group-hover:text-custom-text-200 group-hover:bg-custom-background-80",
  label: "text-xs font-semibold",
  labelActive: "text-custom-text-200",
  labelInactive: "group-hover:text-custom-text-200 text-custom-text-300",
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const AppSidebarItemLabel: React.FC<AppSidebarItemLabelProps> = ({ highlight = false, label }) => {
  if (!label) return null;

  return (
    <span
      className={cn(styles.label, {
        [styles.labelActive]: highlight,
        [styles.labelInactive]: !highlight,
      })}
    >
      {label}
    </span>
  );
};

const AppSidebarItemIcon: React.FC<AppSidebarItemIconProps> = ({ icon, highlight }) => {
  if (!icon) return null;

  return (
    <div
      className={cn(styles.icon, {
        [styles.iconActive]: highlight,
        [styles.iconInactive]: !highlight,
      })}
    >
      {icon}
    </div>
  );
};

const AppSidebarLinkItem: React.FC<AppSidebarLinkItemProps> = ({ href, children, className }) => {
  if (!href) return null;

  return (
    <Link href={href} className={cn(styles.base, className)}>
      {children}
    </Link>
  );
};

const AppSidebarButtonItem: React.FC<AppSidebarButtonItemProps> = ({
  children,
  onClick,
  disabled = false,
  className,
}) => (
  <button className={cn(styles.base, className)} onClick={onClick} disabled={disabled} type="button">
    {children}
  </button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type AppSidebarItemComponent = React.FC<AppSidebarItemProps> & {
  Label: React.FC<AppSidebarItemLabelProps>;
  Icon: React.FC<AppSidebarItemIconProps>;
  Link: React.FC<AppSidebarLinkItemProps>;
  Button: React.FC<AppSidebarButtonItemProps>;
};

const AppSidebarItem: AppSidebarItemComponent = ({ variant = "link", item }) => {
  if (!item) return null;

  const { icon, isActive, label, href, onClick, disabled } = item;

  const commonItems = (
    <>
      <AppSidebarItemIcon icon={icon} highlight={isActive} />
      <AppSidebarItemLabel highlight={isActive} label={label} />
    </>
  );

  if (variant === "link") {
    return <AppSidebarLinkItem href={href}>{commonItems}</AppSidebarLinkItem>;
  }

  return (
    <AppSidebarButtonItem onClick={onClick} disabled={disabled}>
      {commonItems}
    </AppSidebarButtonItem>
  );
};

// ============================================================================
// COMPOUND COMPONENT ASSIGNMENT
// ============================================================================

AppSidebarItem.Label = AppSidebarItemLabel;
AppSidebarItem.Icon = AppSidebarItemIcon;
AppSidebarItem.Link = AppSidebarLinkItem;
AppSidebarItem.Button = AppSidebarButtonItem;

export { AppSidebarItem };
export type { AppSidebarItemData, AppSidebarItemProps };
