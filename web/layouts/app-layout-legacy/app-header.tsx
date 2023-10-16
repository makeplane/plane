// next imports
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import { Bars3Icon } from "@heroicons/react/24/outline";
// ui components
import { Tooltip } from "@plane/ui";
// hooks
import useProjectDetails from "hooks/use-project-details";

type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  noHeader: boolean;
};

const { NEXT_PUBLIC_DEPLOY_URL } = process.env;
let plane_deploy_url = NEXT_PUBLIC_DEPLOY_URL;

if (typeof window !== "undefined" && !plane_deploy_url) {
  plane_deploy_url = window.location.protocol + "//" + window.location.host + "/spaces";
}

const Header: React.FC<Props> = ({ breadcrumbs, left, right, setToggleSidebar, noHeader }) => {
  const { projectDetails } = useProjectDetails();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 px-5 py-4 ${
        noHeader ? "md:hidden" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => setToggleSidebar((prevData) => !prevData)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
        <div>{breadcrumbs}</div>

        {projectDetails && projectDetails?.is_deployed && (
          <Link href={`${plane_deploy_url}/${workspaceSlug}/${projectId}`}>
            <a target="_blank" rel="noreferrer">
              <Tooltip tooltipContent="This project is public, and live on web." position="bottom-left">
                <div className="transition-all flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 p-1 rounded overflow-hidden relative flex items-center gap-1 cursor-pointer group">
                  <div className="w-[14px] h-[14px] flex justify-center items-center">
                    <span className="material-symbols-rounded text-[14px]">radio_button_checked</span>
                  </div>
                  <div className="text-xs font-medium">Public</div>
                  <div className="w-[14px] h-[14px] hidden group-hover:flex justify-center items-center">
                    <span className="material-symbols-rounded text-[14px]">open_in_new</span>
                  </div>
                </div>
              </Tooltip>
            </a>
          </Link>
        )}

        <div className="flex-shrink-0">{left}</div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
};

export default Header;
