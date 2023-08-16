// icons
import { Bars3Icon } from "@heroicons/react/24/outline";
// hooks
import useProjectDetails from "hooks/use-project-details";

type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  noHeader: boolean;
};

const Header: React.FC<Props> = ({ breadcrumbs, left, right, setToggleSidebar, noHeader }) => {
  const { projectDetails } = useProjectDetails();

  console.log("projectDetails", projectDetails);

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
          <div className="flex-shrink-0 bg-custom-primary-500/30 text-custom-primary-100 p-1.5 px-2 rounded overflow-hidden relative flex items-center gap-1">
            <div className="w-[14px] h-[14px] flex justify-center items-center">
              <span className="material-symbols-rounded text-[14px]">radio_button_checked</span>
            </div>
            <div className="text-xs font-medium">Published</div>
          </div>
        )}

        <div className="flex-shrink-0">{left}</div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
};

export default Header;
