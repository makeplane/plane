import { useParams } from "next/navigation";
import { Control, Controller } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IProjectView, IWorkspaceView } from "@plane/types";
// components
import { AccessField } from "@/components/common/access-field";
// constants
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  control: Control<IProjectView, any> | Control<IWorkspaceView, any>;
};
export const AccessController = (props: Props) => {
  const { control } = props;
  // plane web hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const isPrivateViewsEnabled = useFlag(workspaceSlug?.toString(), "VIEW_ACCESS_PRIVATE");

  if (!isPrivateViewsEnabled) return null;

  return (
    <Controller
      control={control as Control<IProjectView, any>}
      name="access"
      render={({ field: { onChange, value } }) => (
        <AccessField onChange={onChange} value={value} accessSpecifiers={VIEW_ACCESS_SPECIFIERS} />
      )}
    />
  );
};
