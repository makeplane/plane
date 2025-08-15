import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// helpers
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
};

export const SpreadsheetLeadColumn: React.FC<Props> = observer((props: Props) => {
  const { project } = props;

  // hooks
  const { workspaceSlug } = useParams();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const lead = getWorkspaceMemberDetails(project.project_lead as string);

  return (
    <div
      className={cn(
        "flex gap-x-2 gap-y-2 h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-4 py-1 text-xs hover:bg-custom-background-80 group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
      )}
    >
      {lead ? (
        <>
          {lead.member.avatar_url && lead.member.avatar_url.trim() !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${lead.member.id}`}>
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full capitalize text-white ">
                <img
                  width={20}
                  src={getFileURL(lead.member.avatar_url)}
                  className="absolute left-0 top-0 h-5 w-5  rounded-full object-cover"
                  alt={lead.member.display_name || lead.member.email}
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${lead.member.id}`}>
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 capitalize text-white">
                {(lead.member.email ?? lead.member.display_name ?? "?")[0]}
              </span>
            </Link>
          )}
          {lead.member.first_name} {lead.member.last_name}
        </>
      ) : (
        "-"
      )}{" "}
    </div>
  );
});
