import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { calculateTimeAgoShort, renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  page: IPage;
};

export const PageEditInformationPopover: React.FC<Props> = observer((props) => {
  const { page } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const editorInformation = page.updated_by ? getUserDetails(page.updated_by) : undefined;
  const creatorInformation = page.created_by ? getUserDetails(page.created_by) : undefined;

  return (
    <div className="flex-shrink-0 relative group/edit-information whitespace-nowrap">
      <span className="text-sm text-custom-text-300">Edited {calculateTimeAgoShort(page.updated_at ?? "")} ago</span>
      <div className="hidden group-hover/edit-information:block absolute z-10 top-full right-0 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 p-2 shadow-custom-shadow-rg space-y-2">
        <div>
          <p className="text-xs font-medium text-custom-text-300">Edited by</p>
          <Link
            href={`/${workspaceSlug?.toString()}/profile/${page.updated_by}`}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium"
          >
            <Avatar
              src={getFileURL(editorInformation?.avatar_url ?? "")}
              name={editorInformation?.display_name}
              className="flex-shrink-0"
              size="sm"
            />
            <span>
              {editorInformation?.display_name}{" "}
              <span className="text-custom-text-300">{renderFormattedDate(page.updated_at)}</span>
            </span>
          </Link>
        </div>
        <div>
          <p className="text-xs font-medium text-custom-text-300">Created by</p>
          <Link
            href={`/${workspaceSlug?.toString()}/profile/${page.created_by}`}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium"
          >
            <Avatar
              src={getFileURL(creatorInformation?.avatar_url ?? "")}
              name={creatorInformation?.display_name}
              className="flex-shrink-0"
              size="sm"
            />
            <span>
              {creatorInformation?.display_name}{" "}
              <span className="text-custom-text-300">{renderFormattedDate(page.created_at)}</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
});
