// icons
import { Bars3Icon } from "@heroicons/react/24/outline";

type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const Header: React.FC<Props> = ({ breadcrumbs, left, right, setToggleSidebar }) => (
  <div className="flex w-full flex-row items-center justify-between gap-y-4 border-b border-skin-base bg-skin-surface-2 px-5 py-4 ">
    <div className="flex items-center gap-2">
      <div className="block md:hidden">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded border border-skin-base"
          onClick={() => setToggleSidebar((prevData) => !prevData)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>
      {breadcrumbs}
      {left}
    </div>
    {right}
  </div>
);

export default Header;
