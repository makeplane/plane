import { Control, Controller } from "react-hook-form";
import { IProjectView, IWorkspaceView } from "@plane/types";
import { AccessField } from "@/components/common/access-field";
import { VIEW_ACCESS_SPECIFIERS } from "@/constants/views";

type Props = {
  control: Control<IProjectView, any> | Control<IWorkspaceView, any>;
};
export const AccessController = (props: Props) => {
  const { control } = props;
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
