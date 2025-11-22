import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import type { TPowerKPageType } from "@/components/power-k/core/types";
import { PowerKMembersMenu } from "@/components/power-k/menus/members";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
// local imports
import { PowerKModuleStatusMenu } from "./status-menu";

type Props = {
  activePage: TPowerKPageType | null;
  handleSelection: (data: unknown) => void;
};

export const PowerKModuleContextBasedPages = observer(function PowerKModuleContextBasedPages(props: Props) {
  const { activePage, handleSelection } = props;
  // navigation
  const { moduleId } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  const {
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : null;
  const projectMemberIds = moduleDetails?.project_id ? getProjectMemberIds(moduleDetails.project_id, false) : [];

  if (!moduleDetails) return null;

  return (
    <>
      {/* members menu */}
      {activePage === "update-module-member" && moduleDetails && (
        <PowerKMembersMenu
          handleSelect={handleSelection}
          userIds={projectMemberIds ?? undefined}
          value={moduleDetails.member_ids}
        />
      )}
      {/* status menu */}
      {activePage === "update-module-status" && moduleDetails?.status && (
        <PowerKModuleStatusMenu handleSelect={handleSelection} value={moduleDetails.status} />
      )}
    </>
  );
});
