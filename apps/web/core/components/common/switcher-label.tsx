import type { FC } from "react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
import { getFileURL, truncateText } from "@plane/utils";

type TSwitcherIconProps = {
  logo_props?: TLogoProps;
  logo_url?: string;
  LabelIcon: FC<ISvgIcons>;
  size?: number;
  type?: "lucide" | "material";
};

export function SwitcherIcon({ logo_props, logo_url, LabelIcon, size = 12, type = "lucide" }: TSwitcherIconProps) {
  if (logo_props?.in_use) {
    return <Logo logo={logo_props} size={size} type={type} />;
  }

  if (logo_url) {
    return (
      <img
        src={getFileURL(logo_url)}
        alt="logo"
        className="rounded-xs object-cover"
        style={{ height: size, width: size }}
      />
    );
  }
  return <LabelIcon height={size} width={size} />;
}

type TSwitcherLabelProps = {
  logo_props?: TLogoProps;
  logo_url?: string;
  name?: string;
  LabelIcon: FC<ISvgIcons>;
  type?: "lucide" | "material";
};

export function SwitcherLabel(props: TSwitcherLabelProps) {
  const { logo_props, name, LabelIcon, logo_url, type = "lucide" } = props;
  return (
    <div className="flex items-center gap-1 text-secondary">
      <SwitcherIcon logo_props={logo_props} logo_url={logo_url} LabelIcon={LabelIcon} type={type} />
      {truncateText(name ?? "", 40)}
    </div>
  );
}
