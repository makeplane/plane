import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn, getFileURL } from "@plane/utils";

type Props = {
  logo: string | null | undefined;
  name: string | undefined;
  classNames?: string;
};

export const WorkspaceLogo = observer((props: Props) => {
  // translation
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        `relative grid h-6 w-6 flex-shrink-0 place-items-center uppercase ${
          !props.logo && "rounded bg-custom-primary-500 text-white"
        } ${props.classNames ? props.classNames : ""}`
      )}
    >
      {props.logo && props.logo !== "" ? (
        <img
          src={getFileURL(props.logo)}
          className="absolute left-0 top-0 h-full w-full rounded object-cover"
          alt={t("aria_labels.projects_sidebar.workspace_logo")}
        />
      ) : (
        (props.name?.[0] ?? "...")
      )}
    </div>
  );
});
