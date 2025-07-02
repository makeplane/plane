import { FC } from "react";
import { TLogoProps } from "@plane/types";
import { ISvgIcons, Logo } from "@plane/ui";
import { getFileURL, truncateText } from "@plane/utils";

type TSwitcherIconProps = {
  logo_props?: TLogoProps;
  logo_url?: string;
  LabelIcon: FC<ISvgIcons>;
  size?: number;
};

export const SwitcherIcon: FC<TSwitcherIconProps> = ({ logo_props, logo_url, LabelIcon, size = 12 }) => {
  if (logo_props?.in_use) {
    return <Logo logo={logo_props} size={size} type="lucide" />;
  }

  if (logo_url) {
    return (
      <img
        src={getFileURL(logo_url)}
        alt="logo"
        className="rounded-sm object-cover"
        style={{ height: size, width: size }}
      />
    );
  }
  return <LabelIcon height={size} width={size} />;
};

type TSwitcherLabelProps = {
  logo_props?: TLogoProps;
  logo_url?: string;
  name?: string;
  LabelIcon: FC<ISvgIcons>;
};

export const SwitcherLabel: FC<TSwitcherLabelProps> = (props) => {
  const { logo_props, name, LabelIcon, logo_url } = props;
  return (
    <div className="flex items-center gap-1 text-custom-text-200">
      <SwitcherIcon logo_props={logo_props} logo_url={logo_url} LabelIcon={LabelIcon} />
      {truncateText(name ?? "", 40)}
    </div>
  );
};
