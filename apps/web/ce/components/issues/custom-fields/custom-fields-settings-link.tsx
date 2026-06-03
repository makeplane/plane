import Link from "next/link";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const CustomFieldsSettingsLink = observer(function CustomFieldsSettingsLink(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { allowPermissions } = useUserPermissions();

  const canManage = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  if (!canManage) return null;

  return (
    <Link
      href={`/${workspaceSlug}/settings/projects/${projectId}/custom-fields`}
      className="mt-8 flex items-center justify-between rounded-lg border border-subtle bg-surface-2 px-4 py-3 transition-colors hover:bg-layer-transparent-hover"
    >
      <div>
        <p className="text-body-sm-medium text-primary">Custom fields</p>
        <p className="mt-0.5 text-body-xs-regular text-tertiary">
          Define extra properties for work items in this project
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-tertiary" />
    </Link>
  );
});
