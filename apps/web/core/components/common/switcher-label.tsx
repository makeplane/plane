import { TLogoProps } from "@plane/types";
import { ISvgIcons } from "@plane/ui";
import { getFileURL, truncateText } from "@plane/utils";
import { Logo } from "@/components/common/logo";

type TSwitcherIconProps = {
  logo_props?: TLogoProps;
  logo_url?: string;
  LabelIcon: React.FC<ISvgIcons>;
  size?: number;
  type?: "lucide" | "material";
};

export const SwitcherIcon: React.FC<TSwitcherIconProps> = ({
  logo_props,
  logo_url,
  LabelIcon,
  size = 12,
  type = "lucide",
}) => {
  if (logo_props?.in_use) {
    return <Logo logo={logo_props} size={size} type={type} />;
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
  LabelIcon: React.FC<ISvgIcons>;
  type?: "lucide" | "material";
};

export const SwitcherLabel: React.FC<TSwitcherLabelProps> = (props) => {
  const { logo_props, name, LabelIcon, logo_url, type = "lucide" } = props;
  return (
    <div className="flex items-center gap-1 text-custom-text-200">
      <SwitcherIcon logo_props={logo_props} logo_url={logo_url} LabelIcon={LabelIcon} type={type} />
      {truncateText(name ?? "", 40)}
    </div>
  );
};
