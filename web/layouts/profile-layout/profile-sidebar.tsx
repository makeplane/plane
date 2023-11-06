// mobx react lite
import { observer } from "mobx-react-lite";
import { SettingsSidebar } from "components/project/settings-sidebar";
import { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

const ProfileSidebar: React.FC<{}> = observer(() => {
  const [toggleSidebar, setToggleSidebar] = useState(false)

  return (
    <div>
      <div className="block md:hidden">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
          onClick={() => setToggleSidebar((prevData) => !prevData)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>
      <div
        id="profile-sidebar"
        className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300
          ${toggleSidebar ? "left-0" : "-left-full md:left-0"} hidden lg:block`}
      >
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
      </div>
    </div>
  );
});

export default ProfileSidebar;
