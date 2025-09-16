import { FC } from "react";
import { ISvgIcons } from "@plane/propel/icons";
import { TLogoProps } from "@plane/types";
import { Logo } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { truncateText } from "@/helpers/string.helper";
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
      {logo_props?.in_use ? (
        <Logo logo={logo_props} size={12} type="lucide" />
      ) : logo_url ? (
        <img src={getFileURL(logo_url)} alt="logo" className="rounded-sm w-3 h-3 object-cover" />
      ) : (
        <LabelIcon height={12} width={12} />
      )}
      {truncateText(name ?? "", 40)}
    </div>
  );
};
