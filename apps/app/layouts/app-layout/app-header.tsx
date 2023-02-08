// ui
import { Button } from "components/ui";
// icons
import { Bars3Icon } from "@heroicons/react/24/outline";

type Props = {
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const Header: React.FC<Props> = ({ breadcrumbs, left, right, setToggleSidebar }) => (
  <div className="flex w-full flex-col gap-y-4 border-b border-gray-200 bg-gray-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-2">
      <div className="block md:hidden">
        <Button
          type="button"
          theme="secondary"
          className="h-8 w-8"
          onClick={() => setToggleSidebar((prevData) => !prevData)}
        >
          <Bars3Icon className="h-5 w-5" />
        </Button>
      </div>
      {breadcrumbs}
      {left}
    </div>
    {right}
  </div>
);

export default Header;
